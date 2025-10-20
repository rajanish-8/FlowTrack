# FlowTrack

A modern, full-stack Kanban board application for project management built with Django REST Framework and React. FlowTrack provides an intuitive interface for managing projects, tasks, and team collaboration with role-based access control.

## 🚀 Features

### Core Functionality
- **Kanban Board Interface**: Drag-and-drop task management with status columns (To Do, In Progress, Review, Done)
- **Project Management**: Create, update, and manage multiple projects
- **Task Management**: Create, assign, and track tasks with priorities and due dates
- **User Authentication**: Secure login/signup with token-based authentication
- **Role-Based Access Control**: Super Admin, Manager, and Member roles with different permissions

### User Roles & Permissions
- **Super Admin**: Full system access, can manage all projects and users
- **Manager**: Can create/update tasks, manage project members, view all project tasks
- **Member**: Can update assigned tasks (status and priority), view assigned tasks

### Technical Features
- **Responsive Design**: Mobile-friendly interface with modern UI/UX
- **Real-time Updates**: Dynamic task status updates and project management
- **File Uploads**: Profile picture support with image handling
- **API-First Architecture**: RESTful API with comprehensive endpoints
- **Database Relationships**: Complex many-to-many relationships with proper constraints

## 🛠️ Tech Stack

### Backend
- **Django 5.2.3**: Web framework
- **Django REST Framework**: API development
- **SQLite**: Database (development)
- **Token Authentication**: Secure API access
- **CORS Support**: Cross-origin resource sharing

### Frontend
- **React 19.1.1**: UI library
- **Vite**: Build tool and development server
- **React Router DOM**: Client-side routing
- **@hello-pangea/dnd**: Drag and drop functionality
- **Modern CSS**: Responsive design with custom styling

## 📁 Project Structure

```
FlowTrack/
├── Backend/
│   └── flowtrack/
│       ├── flowtrack/          # Django project settings
│       ├── kanbanboard/        # Main Django app
│       │   ├── models.py       # Database models
│       │   ├── views.py        # API views
│       │   ├── serializers.py  # Data serialization
│       │   ├── urls.py         # URL routing
│       │   └── permissions.py  # Custom permissions
│       ├── media/              # User uploads
│       └── manage.py           # Django management
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── layouts/           # Layout components
│   │   ├── pages/             # Page components
│   │   └── utils/             # Utility functions
│   └── package.json           # Frontend dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd Backend/flowtrack
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install django djangorestframework django-cors-headers pillow
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser:**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Create .env file in frontend directory
   echo "VITE_API_BASE_URL=http://localhost:8000" > .env
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## 📊 Database Models

### Account (User Model)
- Custom user model extending Django's AbstractUser
- Email-based authentication
- Profile picture support
- Skills and role management

### Project
- Project name, description, and timeline
- Many-to-many relationship with users through ProjectMember
- Task relationships

### ProjectMember
- Junction table for user-project relationships
- Role-based permissions (Manager/Member)
- Unique constraint preventing users from joining multiple projects

### Task
- Task details with title, description, due date
- Priority levels (High, Medium, Low)
- Status tracking (To Do, In Progress, Review, Done)
- Assignment to project members

## 🔌 API Endpoints

### Authentication
- `POST /signup/` - User registration
- `POST /login/` - User authentication

### Projects
- `GET /projects/` - List projects
- `POST /projects/` - Create project (Super Admin only)
- `GET /projects/{id}/` - Get project details
- `PUT /projects/{id}/` - Update project
- `DELETE /projects/{id}/` - Delete project

### Tasks
- `GET /tasks/` - List tasks
- `POST /tasks/` - Create task
- `GET /tasks/{id}/` - Get task details
- `PUT /tasks/{id}/` - Update task
- `DELETE /tasks/{id}/` - Delete task

### User Management
- `GET /kanban-board/` - Get user data and projects
- `GET /user-role/` - Get user roles and permissions
- `GET /users/` - List all users (Super Admin only)

## 🎨 Frontend Components

### Core Components
- **Board**: Main application container
- **Header**: Navigation and user profile
- **ColumnContainer**: Kanban board layout
- **TaskCard**: Individual task display
- **ProjectManagement**: Project CRUD operations
- **TaskManagement**: Task CRUD operations

### Key Features
- **Drag & Drop**: Task status updates via drag and drop
- **Modal Management**: Project and task creation/editing
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive error states and loading indicators

## 🔒 Security Features

- **Token Authentication**: Secure API access
- **Role-Based Permissions**: Granular access control
- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Server-side data validation
- **SQL Injection Protection**: Django ORM protection

## 🚀 Deployment

### Backend Deployment
1. Set `DEBUG = False` in settings.py
2. Configure production database (PostgreSQL recommended)
3. Set up static file serving
4. Configure CORS for production domain
5. Use environment variables for sensitive data

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve static files through web server (Nginx/Apache)
3. Configure API base URL for production

## 🐛 Known Issues

- Users can only be assigned to one project at a time
- Profile picture uploads require proper media configuration
- CORS is currently set to allow all origins (development only)

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] File attachments for tasks
- [ ] Advanced filtering and search
- [ ] Project templates
- [ ] Time tracking
- [ ] Mobile app
- [ ] Integration with external tools

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**FlowTrack** - Streamline your project management with modern Kanban boards and collaborative tools.