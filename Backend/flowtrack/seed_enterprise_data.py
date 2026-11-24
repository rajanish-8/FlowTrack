import os
import sys
import django
from datetime import date, timedelta, datetime

sys.path.append(r"C:\Users\kumra\.gemini\antigravity\scratch\FlowTrack\Backend\flowtrack")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "flowtrack.settings")
django.setup()

from kanbanboard.models import (
    Organization,
    OrganizationMembership,
    Account,
    Project,
    ProjectMember,
    Task,
    Client,
    ActivityLog,
    TaskComment,
    TimeEntry,
)
from rest_framework.authtoken.models import Token

print("=== Starting FlowTrack Enterprise Data Seeder ===")

# 1. Target Organization: RK Workspace (id=3)
org = Organization.objects.filter(id=3).first()
if not org:
    org = Organization.objects.first()
if not org:
    org = Organization.objects.create(name="FlowTrack Enterprise Cloud", description="Main agile workspace")

org.name = "FlowTrack Enterprise Cloud"
org.description = "Primary Agile engineering and product development organization"
org.save()
print(f"Configured Organization: {org.name} (id={org.id})")

# 2. Team Members Setup
team_specs = [
    {
        "username": "flowtrack@gmail.com",
        "email": "flowtrack@gmail.com",
        "first_name": "Rajanish",
        "last_name": "Kumrawat",
        "role": "owner",
        "skills": "Full-Stack Architecture, React 19, Python, PostgreSQL 3NF, UI/UX Ergonomics",
    },
    {
        "username": "priyanshu.choudhary",
        "email": "priyanshu.choudhary@flowtrack.io",
        "first_name": "Priyanshu",
        "last_name": "Choudhary",
        "role": "manager",
        "skills": "Frontend Systems, React 19, Fractional Indexing, Drag & Drop Engines",
    },
    {
        "username": "priyanshu.tiwari",
        "email": "priyanshu.tiwari@flowtrack.io",
        "first_name": "Priyanshu",
        "last_name": "Tiwari",
        "role": "manager",
        "skills": "Django REST Framework, Database Schemas, Redis Caching, Cloud Ops",
    },
    {
        "username": "pradeep.mehta",
        "email": "pradeep.mehta@medicaps.ac.in",
        "first_name": "Pradeep Kumar",
        "last_name": "Mehta",
        "role": "manager",
        "skills": "Agile Governance, Systems Verification, Enterprise Software Architecture",
    },
    {
        "username": "alex.chen",
        "email": "alex.chen@flowtrack.io",
        "first_name": "Alex",
        "last_name": "Chen",
        "role": "member",
        "skills": "DevOps, Kubernetes, Docker, AWS EKS, Prometheus & Grafana",
    },
    {
        "username": "sophia.martinez",
        "email": "sophia.martinez@flowtrack.io",
        "first_name": "Sophia",
        "last_name": "Martinez",
        "role": "member",
        "skills": "Lead QA, Playwright, Jest, Load & Stress Verification, JMeter",
    },
    {
        "username": "marcus.vance",
        "email": "marcus.vance@flowtrack.io",
        "first_name": "Marcus",
        "last_name": "Vance",
        "role": "member",
        "skills": "Product Management, Scrum Master, User Stories, Roadmap Strategy",
    },
    {
        "username": "elena.rostova",
        "email": "elena.rostova@flowtrack.io",
        "first_name": "Elena",
        "last_name": "Rostova",
        "role": "member",
        "skills": "AI Engineering, LLM Integration, Prompt Engineering, Vector Search",
    },
    {
        "username": "manager@flowtrack.test",
        "email": "manager@flowtrack.test",
        "first_name": "Demo",
        "last_name": "Manager",
        "role": "manager",
        "skills": "Sprint Planning, Team Allocation, Milestone Tracking",
    },
    {
        "username": "member@flowtrack.test",
        "email": "member@flowtrack.test",
        "first_name": "Demo",
        "last_name": "Member",
        "role": "member",
        "skills": "Feature Implementation, Code Review, Bug Resolution",
    },
]

users_by_email = {}
for spec in team_specs:
    u = Account.objects.filter(email=spec["email"]).first()
    if not u:
        u = Account.objects.filter(username=spec["username"]).first()
    if not u:
        u = Account.objects.create_user(
            username=spec["username"],
            email=spec["email"],
            password="password123",
            first_name=spec["first_name"],
            last_name=spec["last_name"],
        )
    else:
        u.first_name = spec["first_name"]
        u.last_name = spec["last_name"]
        u.set_password("password123")
    u.skills = spec["skills"]
    u.save()

    Token.objects.get_or_create(user=u)

    # Membership in organization
    mem = OrganizationMembership.objects.filter(user=u).first()
    if mem:
        mem.organization = org
        mem.role = spec["role"]
        mem.save()
    else:
        mem = OrganizationMembership.objects.create(
            organization=org, user=u, role=spec["role"]
        )

    users_by_email[spec["email"]] = u
    print(f"User synced: {u.get_full_name()} ({u.email}) - Role: {spec['role']}")

# 3. Enterprise Clients (Clients & CRM)
client_specs = [
    {
        "name": "Acme FinTech Global",
        "contact_name": "David Sterling (Chief Technology Officer)",
        "email": "david.sterling@acmefintech.com",
        "phone": "+1 (555) 234-5678",
        "website": "https://acmefintech.com",
        "notes": "Tier 1 Enterprise Client. Custom SSO, audit logs, and 99.99% SLA required. Annual contract: $64,000/yr.",
    },
    {
        "name": "Nexus Health Systems",
        "contact_name": "Dr. Rachel Adams (VP of Digital Health)",
        "email": "r.adams@nexushealth.org",
        "phone": "+1 (555) 345-6789",
        "website": "https://nexushealth.org",
        "notes": "HIPAA-compliant task flows and encrypted audit trails. Annual contract: $88,000/yr.",
    },
    {
        "name": "Apex Logistics AI",
        "contact_name": "Vikram Malhotra (Head of Engineering)",
        "email": "v.malhotra@apexlogistics.io",
        "phone": "+1 (555) 456-7890",
        "website": "https://apexlogistics.io",
        "notes": "Dispatch tracking & multi-depot fleet management platform. Annual contract: $42,000/yr.",
    },
    {
        "name": "Medi-Caps Innovation Incubator",
        "contact_name": "Prof. Pradeep Kumar Mehta (Principal Advisor)",
        "email": "pradeep.mehta@medicaps.ac.in",
        "phone": "+91 98260 12345",
        "website": "https://medicaps.ac.in",
        "notes": "Academic IP incubation and Major Project evaluation partnership.",
    },
    {
        "name": "CloudScale Infrastructure Networks",
        "contact_name": "Sarah Jenkins (Cloud Operations Lead)",
        "email": "sjenkins@cloudscale.net",
        "phone": "+1 (555) 567-8901",
        "website": "https://cloudscale.net",
        "notes": "Multi-region Kubernetes deployment and Redis caching infrastructure partner. Annual contract: $36,000/yr.",
    },
]

clients_by_name = {}
for cs in client_specs:
    cl, created = Client.objects.get_or_create(
        organization=org, name=cs["name"], defaults=cs
    )
    if not created:
        for k, v in cs.items():
            setattr(cl, k, v)
        cl.save()
    clients_by_name[cs["name"]] = cl
    print(f"Client synced: {cl.name} ({cl.contact_name})")

# 4. Enterprise Projects
project_specs = [
    {
        "id": 3,  # Existing FlowTrack Web Platform
        "name": "FlowTrack Web Platform",
        "client": clients_by_name["Acme FinTech Global"],
        "description": "Enterprise Agile & Kanban work management platform with real-time multi-perspective views, fractional indexing, and optimistic UI reconciliation.",
        "end_date": date.today() + timedelta(days=45),
    },
    {
        "name": "FlowTrack Mobile iOS & Android",
        "client": clients_by_name["Nexus Health Systems"],
        "description": "Cross-platform mobile client built with React Native featuring offline sprint caching, biometric auth, and push notifications.",
        "end_date": date.today() + timedelta(days=60),
    },
    {
        "name": "Cloud DevOps & CI/CD Pipeline",
        "client": clients_by_name["Apex Logistics AI"],
        "description": "Automated containerized delivery infrastructure on AWS EKS with Prometheus monitoring, multi-region replication, and zero-downtime rolling deploys.",
        "end_date": date.today() + timedelta(days=30),
    },
    {
        "name": "AI Sprint Copilot & Automation Engine",
        "client": clients_by_name["Medi-Caps Innovation Incubator"],
        "description": "Autonomous backlog grooming, natural language task synthesis, automatic sprint retrospectives, and velocity anomaly detection.",
        "end_date": date.today() + timedelta(days=75),
    },
    {
        "name": "Enterprise Client Portal & Billing Hub",
        "client": clients_by_name["CloudScale Infrastructure Networks"],
        "description": "Self-service enterprise client dashboard, milestone approval workflows, contract deliverables tracking, and Stripe billing.",
        "end_date": date.today() + timedelta(days=90),
    },
]

projects_by_name = {}
for ps in project_specs:
    p = None
    if "id" in ps:
        p = Project.objects.filter(id=ps["id"]).first()
    if not p:
        p = Project.objects.filter(organization=org, name=ps["name"]).first()
    if not p:
        p = Project.objects.create(
            organization=org,
            name=ps["name"],
            description=ps["description"],
            client=ps.get("client"),
            end_date=ps.get("end_date"),
        )
    else:
        p.name = ps["name"]
        p.description = ps["description"]
        p.client = ps.get("client")
        p.end_date = ps.get("end_date")
        p.save()

    # Add all team members to project
    for u in users_by_email.values():
        ProjectMember.objects.get_or_create(
            user=u,
            project=p,
            defaults={"role": "manager" if u.email in ["flowtrack@gmail.com", "priyanshu.choudhary@flowtrack.io", "priyanshu.tiwari@flowtrack.io", "pradeep.mehta@medicaps.ac.in"] else "member"}
        )

    projects_by_name[ps["name"]] = p
    print(f"Project synced: {p.name} (id={p.id}, client={p.client.name if p.client else 'None'})")

# 5. Rich Realistic Tasks
# Map helper users
u_raj = users_by_email["flowtrack@gmail.com"]
u_pri_c = users_by_email["priyanshu.choudhary@flowtrack.io"]
u_pri_t = users_by_email["priyanshu.tiwari@flowtrack.io"]
u_mehta = users_by_email["pradeep.mehta@medicaps.ac.in"]
u_alex = users_by_email["alex.chen@flowtrack.io"]
u_sophia = users_by_email["sophia.martinez@flowtrack.io"]
u_marcus = users_by_email["marcus.vance@flowtrack.io"]
u_elena = users_by_email["elena.rostova@flowtrack.io"]

task_catalog = [
    # --- Project 1: FlowTrack Web Platform ---
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Implement Optimistic Drag-and-Drop Reconciliation",
        "description": "Reconcile React 19 client-side Kanban drag state with DRF backend using fractional indexing mid-point strings. Rollback on network timeout.",
        "status": "in progress",
        "priority": "high",
        "assigned_to": u_pri_c,
        "due_date": date.today() + timedelta(days=4),
        "tags": ["Frontend", "React 19", "DND", "Performance"],
        "estimated_hours": 16,
        "checklist": [
            {"text": "Compute midpoint fractional index", "completed": True},
            {"text": "Implement optimistic client state update", "completed": True},
            {"text": "Add error boundary & rollback trigger", "completed": False},
            {"text": "Benchmarked drag latency under 32ms", "completed": False},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Zero-Drift Monotonic Interval Stopwatch Engine",
        "description": "Build high-precision stopwatch using requestAnimationFrame and performance.now() so time logging does not drift when browser tab is inactive.",
        "status": "review",
        "priority": "medium",
        "assigned_to": u_raj,
        "due_date": date.today() + timedelta(days=2),
        "tags": ["Frontend", "Hooks", "TimeTracking"],
        "estimated_hours": 12,
        "checklist": [
            {"text": "Use performance.now() elapsed delta", "completed": True},
            {"text": "Sync time entries to Django REST API", "completed": True},
            {"text": "Add background tab visibilitychange listener", "completed": True},
            {"text": "Display active timer badge in task card", "completed": True},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Dual-Theme CSS Token Engine & Dark Mode Toggle",
        "description": "Implement zero-flicker light and dark mode CSS custom property tokens conforming to WCAG 2.1 AA 4.5:1 contrast standards.",
        "status": "done",
        "priority": "high",
        "assigned_to": u_raj,
        "due_date": date.today() - timedelta(days=2),
        "tags": ["UI/UX", "Tailwind", "Accessibility"],
        "estimated_hours": 14,
        "checklist": [
            {"text": "Define data-theme CSS variables", "completed": True},
            {"text": "Persist theme selection in localStorage", "completed": True},
            {"text": "WCAG 2.1 AA contrast audit", "completed": True},
            {"text": "Keyboard shortcut 'D' theme switcher", "completed": True},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Initialize Database Schema & 3NF Migrations",
        "description": "Design Crow's Foot Relational schema with normalized 3NF tables for Organization, Project, Task, Tag, and AuditLog with foreign key cascade rules.",
        "status": "done",
        "priority": "low",
        "assigned_to": u_pri_t,
        "due_date": date.today() - timedelta(days=6),
        "tags": ["Database", "PostgreSQL", "3NF"],
        "estimated_hours": 20,
        "checklist": [
            {"text": "Define Django ORM models", "completed": True},
            {"text": "Run makemigrations and migrate", "completed": True},
            {"text": "Add composite database index on (project_id, status)", "completed": True},
            {"text": "Write initial seed fixtures", "completed": True},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Set Up JWT Authentication & Token Rotation",
        "description": "Configure HTTP-only cookie JWT tokens with automated refresh token rotation and cross-site request forgery (CSRF) protection.",
        "status": "to do",
        "priority": "high",
        "assigned_to": u_pri_t,
        "due_date": date.today() + timedelta(days=7),
        "tags": ["Security", "JWT", "Backend"],
        "estimated_hours": 18,
        "checklist": [
            {"text": "Install djangorestframework-simplejwt", "completed": True},
            {"text": "Configure Blacklist refresh token table", "completed": False},
            {"text": "Add Axios interceptor for automatic 401 refresh", "completed": False},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Executive PDF Sprint Report & CSV Generator",
        "description": "Provide instant one-click executive print dialog and downloadable CSV spreadsheet of all board tasks with filtered attributes.",
        "status": "done",
        "priority": "medium",
        "assigned_to": u_sophia,
        "due_date": date.today() - timedelta(days=1),
        "tags": ["Export", "Reports", "PDF"],
        "estimated_hours": 10,
        "checklist": [
            {"text": "Generate sanitized CSV blob with headers", "completed": True},
            {"text": "Design print CSS stylesheet for clean pagination", "completed": True},
            {"text": "Add completion velocity calculation", "completed": True},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Multi-Perspective View Ergonomics (Calendar & Table)",
        "description": "Build cohesive monthly calendar grid and sortable spreadsheet data table synchronized to identical underlying Kanban state.",
        "status": "done",
        "priority": "medium",
        "assigned_to": u_pri_c,
        "due_date": date.today() - timedelta(days=3),
        "tags": ["Frontend", "Views", "Calendar"],
        "estimated_hours": 16,
        "checklist": [
            {"text": "Build month grid with date cells", "completed": True},
            {"text": "Build sortable spreadsheet table", "completed": True},
            {"text": "Bind global keyboard shortcuts [B], [M], [T], [E]", "completed": True},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "title": "Conduct Nielsen Norman Usability Heuristics Audit",
        "description": "Formal usability audit across all 10 heuristics. Calculated System Usability Scale (SUS) score targeting Grade A+ (>=85.0).",
        "status": "to do",
        "priority": "low",
        "assigned_to": u_mehta,
        "due_date": date.today() + timedelta(days=10),
        "tags": ["QA", "Audit", "SUS"],
        "estimated_hours": 12,
        "checklist": [
            {"text": "Audit visibility of system status", "completed": True},
            {"text": "Audit error prevention & recovery dialogs", "completed": False},
            {"text": "Compile final SUS questionnaire results", "completed": False},
        ],
    },

    # --- Project 2: FlowTrack Mobile iOS & Android ---
    {
        "project": projects_by_name["FlowTrack Mobile iOS & Android"],
        "title": "Configure React Native Offline WatermelonDB Sync",
        "description": "Implement local SQLite WatermelonDB replica on iOS/Android to allow seamless offline task movements with sync on reconnection.",
        "status": "in progress",
        "priority": "high",
        "assigned_to": u_pri_c,
        "due_date": date.today() + timedelta(days=8),
        "tags": ["Mobile", "Offline", "SQLite"],
        "estimated_hours": 24,
        "checklist": [
            {"text": "Initialize WatermelonDB models", "completed": True},
            {"text": "Build sync queue for pending mutations", "completed": True},
            {"text": "Handle merge conflicts with last-write-wins", "completed": False},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Mobile iOS & Android"],
        "title": "Push Notification Dispatch for Approaching Deadlines",
        "description": "Integrate Firebase Cloud Messaging (FCM) to trigger high-priority alerts 24 hours and 2 hours before scheduled task due dates.",
        "status": "to do",
        "priority": "medium",
        "assigned_to": u_marcus,
        "due_date": date.today() + timedelta(days=12),
        "tags": ["Mobile", "FCM", "Notifications"],
        "estimated_hours": 14,
        "checklist": [
            {"text": "Configure APNs and FCM credentials", "completed": False},
            {"text": "Add Celery periodic worker for deadline checks", "completed": False},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Mobile iOS & Android"],
        "title": "Biometric Authentication (FaceID & Fingerprint)",
        "description": "Secure mobile application startup with native iOS FaceID and Android BiometricPrompt hardware APIs.",
        "status": "done",
        "priority": "high",
        "assigned_to": u_alex,
        "due_date": date.today() - timedelta(days=5),
        "tags": ["Mobile", "Security", "Biometrics"],
        "estimated_hours": 16,
        "checklist": [
            {"text": "Bridge react-native-biometrics", "completed": True},
            {"text": "Store encrypted refresh token in Secure Enclave", "completed": True},
            {"text": "Add passcode fallback authentication", "completed": True},
        ],
    },
    {
        "project": projects_by_name["FlowTrack Mobile iOS & Android"],
        "title": "Gesture-Driven Kanban Column Swipe Engine",
        "description": "Silky-smooth horizontal paging gestures for columns with haptic feedback on card snap and stage movement.",
        "status": "review",
        "priority": "medium",
        "assigned_to": u_pri_c,
        "due_date": date.today() + timedelta(days=3),
        "tags": ["Mobile", "Gestures", "UI"],
        "estimated_hours": 18,
        "checklist": [
            {"text": "Configure react-native-gesture-handler", "completed": True},
            {"text": "Add iOS Taptic engine feedback", "completed": True},
            {"text": "Test 60 FPS performance on low-end Android", "completed": False},
        ],
    },

    # --- Project 3: Cloud DevOps & CI/CD Pipeline ---
    {
        "project": projects_by_name["Cloud DevOps & CI/CD Pipeline"],
        "title": "Multi-Stage Dockerfile Optimization for DRF & React",
        "description": "Trim production container images under 140MB using Alpine Linux base, multi-stage builder caches, and non-root users.",
        "status": "done",
        "priority": "high",
        "assigned_to": u_alex,
        "due_date": date.today() - timedelta(days=4),
        "tags": ["DevOps", "Docker", "Security"],
        "estimated_hours": 12,
        "checklist": [
            {"text": "Create multi-stage builder for Vite", "completed": True},
            {"text": "Use python:3.11-alpine for DRF backend", "completed": True},
            {"text": "Enforce non-root app user execution", "completed": True},
        ],
    },
    {
        "project": projects_by_name["Cloud DevOps & CI/CD Pipeline"],
        "title": "Configure GitHub Actions CI/CD Pipeline with Pytest",
        "description": "Automated workflow triggering linting (flake8, ESLint), 20 backend unit test cases, Vite production build, and AWS ECR upload.",
        "status": "done",
        "priority": "high",
        "assigned_to": u_alex,
        "due_date": date.today() - timedelta(days=7),
        "tags": ["DevOps", "CI/CD", "Testing"],
        "estimated_hours": 16,
        "checklist": [
            {"text": "Configure GitHub Action matrix", "completed": True},
            {"text": "Execute 20 unit & verification test cases", "completed": True},
            {"text": "Automate Docker push to AWS ECR", "completed": True},
        ],
    },
    {
        "project": projects_by_name["Cloud DevOps & CI/CD Pipeline"],
        "title": "AWS EKS Kubernetes Cluster Provisioning via Terraform",
        "description": "Terraform Infrastructure as Code (IaC) defining VPC, subnets, EKS managed node groups, ALB Ingress, and Route53 DNS.",
        "status": "in progress",
        "priority": "high",
        "assigned_to": u_alex,
        "due_date": date.today() + timedelta(days=6),
        "tags": ["DevOps", "AWS", "Kubernetes", "Terraform"],
        "estimated_hours": 28,
        "checklist": [
            {"text": "Write Terraform VPC module", "completed": True},
            {"text": "Configure AWS Load Balancer Controller", "completed": True},
            {"text": "Deploy Cert-Manager for Let's Encrypt SSL", "completed": False},
        ],
    },
    {
        "project": projects_by_name["Cloud DevOps & CI/CD Pipeline"],
        "title": "Prometheus & Grafana Telemetry Dashboard",
        "description": "Live metrics instrumentation monitoring request rate, 95th percentile latency (<98ms), CPU/memory spikes, and DB connection pool.",
        "status": "to do",
        "priority": "medium",
        "assigned_to": u_sophia,
        "due_date": date.today() + timedelta(days=14),
        "tags": ["DevOps", "Monitoring", "Telemetry"],
        "estimated_hours": 14,
        "checklist": [
            {"text": "Export Django django-prometheus metrics", "completed": False},
            {"text": "Import Grafana dashboard for HTTP telemetry", "completed": False},
        ],
    },

    # --- Project 4: AI Sprint Copilot & Automation Engine ---
    {
        "project": projects_by_name["AI Sprint Copilot & Automation Engine"],
        "title": "Natural Language Task Synthesis & Auto-Classification",
        "description": "Enable users to speak or type 'Create high-priority bug for login auth by Friday' and extract structured task attributes via LLM prompt schema.",
        "status": "in progress",
        "priority": "high",
        "assigned_to": u_elena,
        "due_date": date.today() + timedelta(days=5),
        "tags": ["AI", "NLP", "Copilot"],
        "estimated_hours": 20,
        "checklist": [
            {"text": "Define JSON schema for task extraction", "completed": True},
            {"text": "Implement few-shot prompt for priority detection", "completed": True},
            {"text": "Connect Web Speech API speech-to-text", "completed": True},
            {"text": "Add auto-tagging classifier", "completed": False},
        ],
    },
    {
        "project": projects_by_name["AI Sprint Copilot & Automation Engine"],
        "title": "Automated Sprint Retrospective & Velocity Forecasting",
        "description": "Synthesize sprint metrics into an executive summary highlighting delivery bottlenecks, top contributors, and forecast completion date.",
        "status": "review",
        "priority": "medium",
        "assigned_to": u_elena,
        "due_date": date.today() + timedelta(days=2),
        "tags": ["AI", "Analytics", "Velocity"],
        "estimated_hours": 16,
        "checklist": [
            {"text": "Aggregate weekly task completion deltas", "completed": True},
            {"text": "Compute Monte Carlo delivery probabilistic forecast", "completed": True},
            {"text": "Generate executive narrative summary", "completed": False},
        ],
    },
    {
        "project": projects_by_name["AI Sprint Copilot & Automation Engine"],
        "title": "Smart Assignee Recommendation based on Skill Match",
        "description": "Analyze task description keywords against team member skill profiles (e.g. 'React' -> Priyanshu C., 'Postgres' -> Priyanshu T.) to suggest best assignee.",
        "status": "to do",
        "priority": "low",
        "assigned_to": u_elena,
        "due_date": date.today() + timedelta(days=11),
        "tags": ["AI", "Algorithms", "Matching"],
        "estimated_hours": 14,
        "checklist": [
            {"text": "Vectorize team member skills profiles", "completed": False},
            {"text": "Calculate cosine similarity of task tags to skills", "completed": False},
        ],
    },

    # --- Project 5: Enterprise Client Portal & Billing Hub ---
    {
        "project": projects_by_name["Enterprise Client Portal & Billing Hub"],
        "title": "Stripe Customer Portal & Subscription Webhooks",
        "description": "Integrate Stripe billing with automated monthly invoicing, plan upgrades, tier validation, and failed charge notifications.",
        "status": "review",
        "priority": "high",
        "assigned_to": u_pri_t,
        "due_date": date.today() + timedelta(days=3),
        "tags": ["Billing", "Stripe", "Fintech"],
        "estimated_hours": 22,
        "checklist": [
            {"text": "Configure Stripe SDK and API keys", "completed": True},
            {"text": "Verify Stripe webhook cryptographic signatures", "completed": True},
            {"text": "Auto-upgrade organization seat quotas", "completed": False},
        ],
    },
    {
        "project": projects_by_name["Enterprise Client Portal & Billing Hub"],
        "title": "Client Deliverable Milestone Approval Workflow",
        "description": "Dedicated read-only view for enterprise client stakeholders to sign off on sprint deliverables and review live demo links.",
        "status": "done",
        "priority": "medium",
        "assigned_to": u_marcus,
        "due_date": date.today() - timedelta(days=3),
        "tags": ["CRM", "Clients", "Workflows"],
        "estimated_hours": 14,
        "checklist": [
            {"text": "Build Client Stakeholder JWT token role", "completed": True},
            {"text": "Add one-click deliverable approval signature", "completed": True},
            {"text": "Generate signed approval audit record", "completed": True},
        ],
    },
    {
        "project": projects_by_name["Enterprise Client Portal & Billing Hub"],
        "title": "Billable Time Export & Automated PDF Invoice Generator",
        "description": "Aggregate developer logged hours from Stopwatch intervals and format into official itemized client invoices.",
        "status": "in progress",
        "priority": "medium",
        "assigned_to": u_raj,
        "due_date": date.today() + timedelta(days=5),
        "tags": ["Billing", "PDF", "Reports"],
        "estimated_hours": 16,
        "checklist": [
            {"text": "Query TimeEntry records grouped by task and client", "completed": True},
            {"text": "Calculate hourly billable rates ($120/hr standard)", "completed": True},
            {"text": "Render branded PDF invoice with tax breakdown", "completed": False},
        ],
    },
]

# Sync all tasks
created_tasks_count = 0
for ts in task_catalog:
    clean_title = ts["title"][:50]
    proj = ts["project"]
    user = ts["assigned_to"]

    pm, _ = ProjectMember.objects.get_or_create(
        user=user,
        project=proj,
        defaults={"role": "manager" if user.email in ["flowtrack@gmail.com", "priyanshu.choudhary@flowtrack.io", "priyanshu.tiwari@flowtrack.io", "pradeep.mehta@medicaps.ac.in"] else "member"}
    )

    t = Task.objects.filter(project=proj, title=clean_title).first()
    if not t:
        t = Task.objects.create(
            project=proj,
            title=clean_title,
            description=ts["description"],
            status=ts["status"],
            priority=ts["priority"],
            assigned_to=pm,
            due_date=ts["due_date"],
            checklist=ts["checklist"],
            tags=ts["tags"],
            estimated_hours=ts["estimated_hours"],
        )
        created_tasks_count += 1
    else:
        t.description = ts["description"]
        t.status = ts["status"]
        t.priority = ts["priority"]
        t.assigned_to = pm
        t.due_date = ts["due_date"]
        t.checklist = ts["checklist"]
        t.tags = ts["tags"]
        t.estimated_hours = ts["estimated_hours"]
        t.save()

    # Add comments and time entries to tasks
    if t.comments.count() == 0:
        TaskComment.objects.create(
            task=t,
            user=ts["assigned_to"],
            content=f"Initial technical specification drafted. Target delivery: {ts['due_date']}.",
        )
        if t.status in ["review", "done"]:
            TaskComment.objects.create(
                task=t,
                user=u_sophia,
                content="Verification test cases passed. PR approved for deployment.",
            )

    if t.time_entries.count() == 0 and t.status in ["in progress", "review", "done"]:
        TimeEntry.objects.create(
            task=t,
            user=ts["assigned_to"],
            duration_minutes=ts["estimated_hours"] * 45,
            notes="Active development and verification sprint work",
            billable=True,
        )

print(f"Synced {len(task_catalog)} technical tasks across all 5 enterprise projects!")

# 6. Chronological Activity Logs
activity_events = [
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "user": u_pri_c,
        "action": "task_moved",
        "details": "Moved 'Implement Optimistic Drag-and-Drop Reconciliation' to In Progress (Drag latency <32ms)",
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "user": u_raj,
        "action": "task_moved",
        "details": "Advanced 'Zero-Drift Monotonic Interval Stopwatch Engine' to Review after drift-free test pass",
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "user": u_raj,
        "action": "task_created",
        "details": "Created new critical task 'Set Up JWT Authentication & Token Rotation'",
    },
    {
        "project": projects_by_name["FlowTrack Web Platform"],
        "user": u_sophia,
        "action": "checklist_updated",
        "details": "Completed all verification items on 'Dual-Theme CSS Token Engine & Dark Mode Toggle'",
    },
    {
        "project": projects_by_name["FlowTrack Mobile iOS & Android"],
        "user": u_alex,
        "action": "task_moved",
        "details": "Biometric Authentication (FaceID & Fingerprint) verified and marked as Done",
    },
    {
        "project": projects_by_name["Cloud DevOps & CI/CD Pipeline"],
        "user": u_alex,
        "action": "task_created",
        "details": "Initiated 'AWS EKS Kubernetes Cluster Provisioning via Terraform'",
    },
    {
        "project": projects_by_name["AI Sprint Copilot & Automation Engine"],
        "user": u_elena,
        "action": "comment_added",
        "details": "Added few-shot prompt benchmark results to 'Natural Language Task Synthesis'",
    },
    {
        "project": projects_by_name["Enterprise Client Portal & Billing Hub"],
        "user": u_marcus,
        "action": "task_moved",
        "details": "Client Deliverable Milestone Approval Workflow signed off by Acme FinTech Global CTO",
    },
]

for act in activity_events:
    ActivityLog.objects.create(
        project=act["project"],
        user=act["user"],
        action=act["action"],
        details=act["details"],
    )

print(f"Generated {len(activity_events)} live audit trail records!")
print("=== FlowTrack Enterprise Data Seeding Completed Successfully! ===")
