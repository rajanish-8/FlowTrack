import os
import json
import urllib.request
import urllib.error
from datetime import date, timedelta
from django.utils import timezone

def clean_gemini_key(raw_key):
    k = str(raw_key or "").strip()
    if k.startswith("export "):
        k = k[7:].strip()
    if k.startswith("GEMINI_API_KEY="):
        k = k[len("GEMINI_API_KEY="):].strip()
    elif k.startswith("GOOGLE_API_KEY="):
        k = k[len("GOOGLE_API_KEY="):].strip()
    k = k.strip('"').strip("'").strip()
    return k


def get_gemini_key():
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY", "")
    key = clean_gemini_key(key)
    if key in ["", "your_gemini_api_key_here", "your_api_key_here", "None"]:
        return ""
    return key


def save_gemini_key(api_key):
    api_key = clean_gemini_key(api_key)
    os.environ["GEMINI_API_KEY"] = api_key
    from django.conf import settings
    env_file = settings.BASE_DIR / '.env'
    lines = []
    found = False
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('GEMINI_API_KEY='):
                    lines.append(f'GEMINI_API_KEY={api_key}\n')
                    found = True
                else:
                    lines.append(line)
    if not found:
        lines.append(f'GEMINI_API_KEY={api_key}\n')
    with open(env_file, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    return True


def test_gemini_key(api_key):
    cleaned = clean_gemini_key(api_key)
    if not cleaned or cleaned == "your_gemini_api_key_here":
        return False, "Please enter a valid key (not placeholder text)."
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={cleaned}"
    payload = json.dumps({"contents": [{"parts": [{"text": "Hello"}]}]}).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                return True, "Success"
            return False, f"Google returned HTTP status {response.status}"
    except urllib.error.HTTPError as e:
        msg = f"HTTP {e.code}: {e.reason}"
        try:
            body = e.read().decode("utf-8")
            data = json.loads(body)
            err_details = data.get("error", {}).get("message")
            if err_details:
                msg = err_details
        except Exception:
            pass
        return False, msg
    except Exception as e:
        return False, f"Connection error: {e}"


def _call_gemini_api(prompt, system_prompt=None, api_key=None):
    """
    Calls Google Gemini API using urllib.
    Falls back to None if no key or if request fails.
    """
    active_key = api_key or get_gemini_key()
    if not active_key:
        return None
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={active_key}"
    
    contents = []
    if system_prompt:
        contents.append({
            "role": "user",
            "parts": [{"text": f"System Instructions: {system_prompt}\n\nTask: {prompt}"}]
        })
    else:
        contents.append({
            "role": "user",
            "parts": [{"text": prompt}]
        })
        
    payload = json.dumps({"contents": contents}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return text
    except Exception as e:
        print(f"Gemini API request failed: {e}")
        return None
    return None


def enhance_task(title, current_description="", project_name="Workspace"):
    """
    Enhances a task title into a well-crafted title, comprehensive description,
    definition of done, and recommended priority level.
    """
    cleaned_title = (title or "").strip()
    if not cleaned_title:
        cleaned_title = "New Task"

    # Try Gemini API first
    system_prompt = (
        "You are an expert Agile Scrum Product Owner and Technical Lead. "
        "Return a valid JSON object with keys: "
        "'enhanced_title' (string), 'description' (markdown string with User Story, Implementation Steps, and Acceptance Criteria), "
        "'suggested_priority' ('low', 'medium', or 'high'), 'estimated_days' (integer)."
    )
    user_prompt = f"Project: {project_name}\nTask: {cleaned_title}\nCurrent notes: {current_description}\nReturn ONLY JSON."
    
    gemini_result = _call_gemini_api(user_prompt, system_prompt)
    if gemini_result:
        try:
            cleaned_json = gemini_result.strip()
            if cleaned_json.startswith("```json"):
                cleaned_json = cleaned_json[7:]
            if cleaned_json.startswith("```"):
                cleaned_json = cleaned_json[3:]
            if cleaned_json.endswith("```"):
                cleaned_json = cleaned_json[:-3]
            data = json.loads(cleaned_json.strip())
            return {
                "enhanced_title": data.get("enhanced_title", cleaned_title),
                "description": data.get("description", ""),
                "suggested_priority": data.get("suggested_priority", "medium").lower(),
                "estimated_days": data.get("estimated_days", 2),
                "ai_powered_by": "Gemini 1.5 Flash"
            }
        except Exception:
            pass

    # Built-in Heuristic NLP Generator
    t_lower = cleaned_title.lower()
    
    priority = "medium"
    if any(k in t_lower for k in ["bug", "fix", "crash", "security", "urgent", "auth", "payment", "critical"]):
        priority = "high"
    elif any(k in t_lower for k in ["docs", "readme", "cleanup", "refactor", "comment", "color", "icon"]):
        priority = "low"

    domain = "Feature Development"
    if any(k in t_lower for k in ["auth", "login", "signup", "jwt", "token", "password"]):
        domain = "User Authentication & Access"
    elif any(k in t_lower for k in ["api", "endpoint", "backend", "crud", "database", "model", "query"]):
        domain = "Backend Engineering"
    elif any(k in t_lower for k in ["ui", "css", "layout", "responsive", "frontend", "card", "board"]):
        domain = "Frontend & UI Design"
    elif any(k in t_lower for k in ["test", "qa", "audit", "coverage", "benchmark"]):
        domain = "Quality Assurance & Testing"
    elif any(k in t_lower for k in ["payment", "stripe", "billing", "checkout", "subscription"]):
        domain = "Payments & Monetization"

    enhanced_desc = f"""### 🎯 Overview ({domain})
As a team member working on **{project_name}**, implement `{cleaned_title}` to ensure robust functionality, test coverage, and smooth user experience.

### 📋 Key Implementation Checklist:
- [ ] Define required data schemas and validation logic.
- [ ] Implement core logic and integrate with dependent modules.
- [ ] Handle error states, edge cases, and loading feedback.
- [ ] Verify responsive layout and cross-device consistency.

### ✅ Acceptance Criteria (Definition of Done):
- [ ] Solution passes unit and functional test checks.
- [ ] Code is peer-reviewed and adheres to project styling standards.
- [ ] Verified locally with no regression in related services."""

    if current_description:
        enhanced_desc += f"\n\n**Additional Context:**\n> {current_description}"

    return {
        "enhanced_title": cleaned_title.title(),
        "description": enhanced_desc,
        "suggested_priority": priority,
        "estimated_days": 3 if priority == "high" else (1 if priority == "low" else 2),
        "ai_powered_by": "FlowTrack Smart Heuristic Engine"
    }


def breakdown_task(title, description=""):
    """
    Decomposes a task into 3-5 concrete, actionable Kanban subtasks.
    """
    cleaned_title = (title or "Project Epic").strip()

    system_prompt = (
        "You are a Senior Software Engineer. Given a task, decompose it into 3 to 5 clear subtasks. "
        "Return a valid JSON object with key 'subtasks': list of objects with "
        "'title' (string), 'priority' ('low', 'medium', or 'high'), 'estimated_hours' (integer)."
    )
    user_prompt = f"Task to break down: {cleaned_title}\nContext: {description}\nReturn ONLY JSON."
    
    gemini_result = _call_gemini_api(user_prompt, system_prompt)
    if gemini_result:
        try:
            cleaned_json = gemini_result.strip()
            if cleaned_json.startswith("```json"):
                cleaned_json = cleaned_json[7:]
            if cleaned_json.startswith("```"):
                cleaned_json = cleaned_json[3:]
            if cleaned_json.endswith("```"):
                cleaned_json = cleaned_json[:-3]
            data = json.loads(cleaned_json.strip())
            return {
                "subtasks": data.get("subtasks", []),
                "ai_powered_by": "Gemini 1.5 Flash"
            }
        except Exception:
            pass

    # Built-in Heuristic Subtask Generator
    t_lower = cleaned_title.lower()
    if any(k in t_lower for k in ["auth", "login", "signup", "user"]):
        subtasks = [
            {"title": f"Design user authentication schema & validators for {cleaned_title}", "priority": "high", "estimated_hours": 4},
            {"title": f"Implement secure token issuance & session management", "priority": "high", "estimated_hours": 6},
            {"title": f"Build responsive login/signup frontend interface", "priority": "medium", "estimated_hours": 5},
            {"title": f"Add integration tests for error states & rate limits", "priority": "medium", "estimated_hours": 3},
        ]
    elif any(k in t_lower for k in ["payment", "stripe", "checkout", "billing"]):
        subtasks = [
            {"title": f"Integrate payment gateway API keys and webhook listeners", "priority": "high", "estimated_hours": 5},
            {"title": f"Create checkout session backend endpoint", "priority": "high", "estimated_hours": 4},
            {"title": f"Design payment confirmation and receipt UI", "priority": "medium", "estimated_hours": 3},
            {"title": f"Test edge cases: declined cards, refunds, and timeouts", "priority": "high", "estimated_hours": 4},
        ]
    elif any(k in t_lower for k in ["ui", "frontend", "design", "page", "modal"]):
        subtasks = [
            {"title": f"Draft wireframes & component hierarchy for {cleaned_title}", "priority": "low", "estimated_hours": 2},
            {"title": f"Build reusable React components and CSS design system", "priority": "medium", "estimated_hours": 5},
            {"title": f"Connect UI state to backend REST API endpoints", "priority": "high", "estimated_hours": 4},
            {"title": f"Ensure accessibility compliance and mobile responsiveness", "priority": "medium", "estimated_hours": 3},
        ]
    else:
        subtasks = [
            {"title": f"Research architecture & technical requirements for {cleaned_title}", "priority": "medium", "estimated_hours": 3},
            {"title": f"Implement core backend logic and database changes", "priority": "high", "estimated_hours": 6},
            {"title": f"Connect frontend views and handle asynchronous states", "priority": "medium", "estimated_hours": 4},
            {"title": f"Perform comprehensive manual QA and write test suites", "priority": "low", "estimated_hours": 3},
        ]

    return {
        "subtasks": subtasks,
        "ai_powered_by": "FlowTrack Smart Heuristic Engine"
    }


def generate_sprint_summary(project):
    """
    Analyzes all tasks in a project to create an executive sprint summary,
    health rating, bottleneck detection, and actionable recommendations.
    """
    tasks = project.tasks.select_related("assigned_to__user").all()
    total_count = tasks.count()

    if total_count == 0:
        return {
            "project_name": project.name,
            "health_score": "Initial",
            "completion_rate": 0,
            "total_tasks": 0,
            "summary": "This project currently has no tasks created. Start by using AI Smart Task Generator to populate your initial backlog.",
            "bottlenecks": ["No active sprint tasks found."],
            "recommendations": ["Create 3 to 5 core milestone tasks to initialize your Kanban board."],
            "velocity_insight": "Awaiting initial sprint commitments.",
            "ai_powered_by": "FlowTrack Intelligence"
        }

    status_counts = {"to do": 0, "in progress": 0, "review": 0, "done": 0}
    priority_counts = {"high": 0, "medium": 0, "low": 0}
    overdue_tasks = []
    today = date.today()

    for t in tasks:
        s = t.status.lower()
        if s in status_counts:
            status_counts[s] += 1
        p = t.priority.lower()
        if p in priority_counts:
            priority_counts[p] += 1
        if t.due_date and t.due_date < today and s != "done":
            overdue_tasks.append(t.title)

    done_count = status_counts["done"]
    completion_rate = int((done_count / total_count) * 100)

    # Determine Health Score
    if completion_rate >= 75:
        health_score = "Excellent"
    elif completion_rate >= 40:
        health_score = "Healthy"
    elif len(overdue_tasks) > 2:
        health_score = "At Risk"
    else:
        health_score = "In Progress"

    bottlenecks = []
    if status_counts["review"] >= 3:
        bottlenecks.append(f"{status_counts['review']} tasks are queued in 'Review'. Team review bandwidth may be saturated.")
    if overdue_tasks:
        bottlenecks.append(f"{len(overdue_tasks)} task(s) past due: {', '.join(overdue_tasks[:2])}")
    if status_counts["in progress"] > 5:
        bottlenecks.append("High Work-in-Progress (WIP) volume. Consider limiting WIP to prevent context-switching delays.")
    if not bottlenecks:
        bottlenecks.append("No major blockers detected. Board workflow is well-balanced.")

    recommendations = []
    if status_counts["review"] > 0:
        recommendations.append("Prioritize code review and QA pass to shift review cards into 'Done'.")
    if priority_counts["high"] > 0 and status_counts["in progress"] < priority_counts["high"]:
        recommendations.append("Ensure team bandwidth is focused on remaining High Priority items before pulling new To-Do tasks.")
    recommendations.append("Schedule a brief standup to align assignees on remaining end-of-week milestones.")

    summary = (
        f"Project '{project.name}' has {total_count} total tasks with a {completion_rate}% completion rate. "
        f"{done_count} tasks are complete, {status_counts['in progress']} active in progress, and {status_counts['review']} pending review."
    )

    return {
        "project_name": project.name,
        "health_score": health_score,
        "completion_rate": completion_rate,
        "total_tasks": total_count,
        "status_distribution": status_counts,
        "summary": summary,
        "bottlenecks": bottlenecks,
        "recommendations": recommendations,
        "velocity_insight": f"Sprint velocity is tracking at {completion_rate}% completion.",
        "ai_powered_by": "FlowTrack Intelligence"
    }


def chat_with_board(project, user_message, user_name="User"):
    """
    Context-aware AI Copilot chatbot capable of answering questions about
    the project's tasks, deadlines, workloads, and creating recommendations.
    """
    tasks = project.tasks.select_related("assigned_to__user").all()
    q_lower = (user_message or "").lower().strip()

    # Try Gemini API if key is available with full context
    task_summaries = [
        f"- '{t.title}' [Status: {t.status}, Priority: {t.priority}, Assignee: {t.assigned_to.user.username if t.assigned_to else 'Unassigned'}, Due: {t.due_date or 'No date'}]"
        for t in tasks
    ]
    board_context = "\n".join(task_summaries) or "No tasks currently on this board."

    system_prompt = (
        f"You are FlowBot, an intelligent AI Copilot embedded inside the FlowTrack project management app. "
        f"You have full context of project '{project.name}'. "
        f"Here are the current tasks on this board:\n{board_context}\n\n"
        f"Answer the user's question clearly, concisely, and insightfully. Use markdown bullet points where appropriate."
    )
    
    gemini_result = _call_gemini_api(user_message, system_prompt)
    if gemini_result:
        return {
            "reply": gemini_result.strip(),
            "ai_powered_by": "Gemini 1.5 Flash"
        }

    # Contextual Smart Heuristic Assistant
    if any(k in q_lower for k in ["in progress", "working", "active"]):
        in_prog = [t for t in tasks if t.status.lower() == "in progress"]
        if in_prog:
            items = "\n".join([f"• **{t.title}** (Priority: {t.priority.title()}, Assigned to: {t.assigned_to.user.username if t.assigned_to else 'Unassigned'})" for t in in_prog])
            reply = f"Here are the **{len(in_prog)} tasks currently In Progress** for *{project.name}*:\n\n{items}"
        else:
            reply = f"There are currently no tasks in the **In Progress** column for *{project.name}*. You can drag a task from 'To Do' or create a new one!"

    elif any(k in q_lower for k in ["due", "deadline", "urgent", "overdue"]):
        today = date.today()
        upcoming = [t for t in tasks if t.due_date and t.status.lower() != "done"]
        if upcoming:
            items = "\n".join([f"• **{t.title}** - Due: `{t.due_date}` (Status: {t.status.title()})" for t in upcoming])
            reply = f"📅 **Active Tasks with Deadlines**:\n\n{items}"
        else:
            reply = "No impending deadlines found for open tasks. All open items either have no set deadline or are completed."

    elif any(k in q_lower for k in ["who", "assignee", "workload", "member", "team"]):
        members = {}
        for t in tasks:
            name = t.assigned_to.user.username if t.assigned_to else "Unassigned"
            members[name] = members.get(name, 0) + 1
        items = "\n".join([f"• **{m}**: {c} task(s)" for m, c in members.items()])
        reply = f"👥 **Team Workload Breakdown for {project.name}**:\n\n{items}"

    elif any(k in q_lower for k in ["summary", "overview", "status", "health"]):
        done = sum(1 for t in tasks if t.status.lower() == "done")
        total = len(tasks)
        rate = int((done / total) * 100) if total > 0 else 0
        reply = (
            f"📊 **Sprint Overview for {project.name}**:\n\n"
            f"- **Total Tasks:** {total}\n"
            f"- **Completed:** {done} ({rate}%)\n"
            f"- **Active Work:** {sum(1 for t in tasks if t.status.lower() == 'in progress')} In Progress, {sum(1 for t in tasks if t.status.lower() == 'review')} in Review.\n"
            f"- **Velocity:** Board is moving forward steadily!"
        )

    else:
        reply = (
            f"Hello {user_name}! I am your **FlowTrack AI Copilot** 🤖.\n\n"
            f"I have direct access to project **'{project.name}'** ({len(tasks)} tasks tracked). Here are some things you can ask me:\n\n"
            f"- *'What tasks are currently in progress?'*\n"
            f"- *'Show upcoming deadlines and urgent items'*\n"
            f"- *'Who has the highest workload?'*\n"
            f"- *'Give me an executive summary of this board'*"
        )

    return {
        "reply": reply,
        "ai_powered_by": "FlowTrack Intelligence"
    }
