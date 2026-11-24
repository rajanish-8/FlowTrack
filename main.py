"""
FlowTrack Unified Application Launcher (main.py)
================================================
Single-command launcher for FlowTrack: Enterprise Agile Kanban Platform.
Orchestrates Django REST Framework backend and React Vite frontend.

Usage:
    python main.py                # Start both servers (unified console, auto-opens browser)
    python main.py --windows      # Start servers in separate CMD windows (see live logs)
    python main.py --stop         # Stop all running FlowTrack servers (ports 8000 & 5173)
    python main.py --status       # Check health status of FlowTrack servers
    python main.py --no-browser   # Start servers without auto-opening browser
"""

import os
import sys
import time
import socket
import signal
import argparse
import subprocess
import webbrowser
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "Backend" / "flowtrack"
FRONTEND_DIR = BASE_DIR / "frontend"

BACKEND_HOST = "127.0.0.1"
BACKEND_PORT = 8000
FRONTEND_PORT = 5173

# Process references for clean shutdown
backend_proc = None
frontend_proc = None


def get_pids_for_port(port: int):
    """Returns a list of Process IDs listening on the specified port."""
    pids = set()
    if sys.platform == "win32":
        try:
            out = subprocess.check_output("netstat -ano", shell=True, text=True, stderr=subprocess.DEVNULL)
            for line in out.splitlines():
                if f":{port} " in line and "LISTENING" in line:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        pids.add(parts[-1])
        except Exception:
            pass
    else:
        try:
            out = subprocess.check_output(f"lsof -t -i:{port}", shell=True, text=True, stderr=subprocess.DEVNULL)
            pids = {p.strip() for p in out.splitlines() if p.strip()}
        except Exception:
            pass
    return list(pids)


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks whether a local TCP port is currently accepting connections."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def kill_port(port: int) -> int:
    """Terminates all processes bound to the given port."""
    pids = get_pids_for_port(port)
    count = 0
    for pid in pids:
        try:
            if sys.platform == "win32":
                subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                subprocess.run(f"kill -9 {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            count += 1
        except Exception:
            pass
    return count


def stop_servers():
    """Stops all running FlowTrack services."""
    print("\n" + "=" * 60)
    print("  Stopping FlowTrack Services (Ports 8000 & 5173)...")
    print("=" * 60)
    k1 = kill_port(BACKEND_PORT)
    k2 = kill_port(FRONTEND_PORT)
    print(f"  * Released port {BACKEND_PORT} (killed {k1} processes)")
    print(f"  * Released port {FRONTEND_PORT} (killed {k2} processes)")
    print("  All FlowTrack servers stopped successfully.\n")


def check_status():
    """Checks whether FlowTrack services are running."""
    print("\n" + "=" * 60)
    print("  FlowTrack Service Health Check")
    print("=" * 60)
    b_up = is_port_in_use(BACKEND_PORT)
    f_up = is_port_in_use(FRONTEND_PORT)
    print(f"  * Django REST Backend  (Port {BACKEND_PORT}) : {'[RUNNING]' if b_up else '[STOPPED]'}")
    print(f"  * React Vite Frontend  (Port {FRONTEND_PORT}) : {'[RUNNING]' if f_up else '[STOPPED]'}")
    if b_up and f_up:
        print("\n  Status: System is fully operational!")
        print("  Access FlowTrack at: http://localhost:5173")
    elif b_up or f_up:
        print("\n  Status: Partial service running. Run 'python main.py --stop' then 'python main.py'.")
    else:
        print("\n  Status: All services are idle. Run 'python main.py' to launch.")
    print("=" * 60 + "\n")


def get_backend_python() -> str:
    """Finds the virtual environment Python executable."""
    if sys.platform == "win32":
        venv_py = BACKEND_DIR / "venv" / "Scripts" / "python.exe"
    else:
        venv_py = BACKEND_DIR / "venv" / "bin" / "python"

    if venv_py.exists():
        return str(venv_py)
    return sys.executable


def get_npm_cmd() -> str:
    """Returns npm executable name for current platform."""
    return "npm.cmd" if sys.platform == "win32" else "npm"


def cleanup_and_exit(signum=None, frame=None):
    """Graceful termination handler for Ctrl+C."""
    print("\n\n" + "=" * 60)
    print("  Shutting down FlowTrack servers...")
    print("=" * 60)

    for proc, name in [(backend_proc, "Django Backend"), (frontend_proc, "React Frontend")]:
        if proc and proc.poll() is None:
            print(f"  Stopping {name} (PID: {proc.pid})...")
            try:
                if sys.platform == "win32":
                    subprocess.run(f"taskkill /F /T /PID {proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    proc.terminate()
            except Exception:
                pass

    kill_port(BACKEND_PORT)
    kill_port(FRONTEND_PORT)
    print("  FlowTrack servers stopped cleanly. Goodbye!\n")
    sys.exit(0)


def wait_for_service(port: int, max_wait: int = 15) -> bool:
    """Waits for a port to become available."""
    start = time.time()
    while time.time() - start < max_wait:
        if is_port_in_use(port):
            return True
        time.sleep(0.5)
    return False


def print_banner():
    banner = """
======================================================================
  ███████╗██╗      ██████╗ ██╗    ██╗████████╗██████╗  █████╗  ██████╗██╗  ██╗
  ██╔════╝██║     ██╔═══██╗██║    ██║╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
  █████╗  ██║     ██║   ██║██║ █╗ ██║   ██║   ██████╔╝███████║██║     █████╔╝ 
  ██╔══╝  ██║     ██║   ██║██║███╗██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ 
  ██║     ███████╗╚██████╔╝╚███╔███╔╝   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗
  ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
======================================================================
         Enterprise Agile Kanban Work Management Platform
======================================================================
"""
    print(banner)


def launch_in_windows():
    """Launches Backend and Frontend in separate CMD windows on Windows."""
    print_banner()
    print("[1/3] Preparing workspace...")
    kill_port(BACKEND_PORT)
    kill_port(FRONTEND_PORT)

    python_exec = get_backend_python()
    manage_py = BACKEND_DIR / "manage.py"

    print("\n[2/3] Spawning server terminal windows...")
    # Launch Backend CMD
    cmd_backend = f'start "FlowTrack - Backend (Port 8000)" cmd /k "cd /d {BACKEND_DIR} && "{python_exec}" manage.py runserver {BACKEND_HOST}:{BACKEND_PORT}""'
    subprocess.run(cmd_backend, shell=True)
    print("  * Backend console opened.")

    time.sleep(2)

    # Launch Frontend CMD
    cmd_frontend = f'start "FlowTrack - Frontend (Port 5173)" cmd /k "cd /d {FRONTEND_DIR} && {get_npm_cmd()} run dev""'
    subprocess.run(cmd_frontend, shell=True)
    print("  * Frontend console opened.")

    time.sleep(2)

    print("\n[3/3] Opening browser...")
    webbrowser.open(f"http://localhost:{FRONTEND_PORT}")

    print("\n" + "=" * 70)
    print("  FlowTrack is running in dedicated terminal windows!")
    print("=" * 70)
    print("  * Application UI : http://localhost:5173")
    print("  * Django API     : http://127.0.0.1:8000/api/")
    print("  * Django Admin   : http://127.0.0.1:8000/admin/")
    print("\n  Pre-seeded Demo Accounts (Password: password123):")
    print("    - Owner   : owner@flowtrack.test")
    print("    - Manager : manager@flowtrack.test")
    print("    - Member  : member@flowtrack.test")
    print("\n  To stop the servers, close the command windows or run:")
    print("    python main.py --stop")
    print("=" * 70 + "\n")


def launch_unified(no_browser=False):
    """Launches both servers managed under a single parent process."""
    global backend_proc, frontend_proc

    signal.signal(signal.SIGINT, cleanup_and_exit)
    signal.signal(signal.SIGTERM, cleanup_and_exit)

    print_banner()

    print("[1/4] Checking ports and environment...")
    if is_port_in_use(BACKEND_PORT):
        print(f"  * Port {BACKEND_PORT} busy. Freeing port...")
        kill_port(BACKEND_PORT)
        time.sleep(1)

    if is_port_in_use(FRONTEND_PORT):
        print(f"  * Port {FRONTEND_PORT} busy. Freeing port...")
        kill_port(FRONTEND_PORT)
        time.sleep(1)

    python_exec = get_backend_python()
    manage_py = BACKEND_DIR / "manage.py"
    npm_cmd = get_npm_cmd()

    if not manage_py.exists():
        print(f"ERROR: Cannot find Django manage.py at {manage_py}")
        sys.exit(1)

    # Launch Backend
    print(f"\n[2/4] Starting Django REST Backend (http://{BACKEND_HOST}:{BACKEND_PORT})...")
    backend_proc = subprocess.Popen(
        [python_exec, str(manage_py), "runserver", f"{BACKEND_HOST}:{BACKEND_PORT}"],
        cwd=str(BACKEND_DIR)
    )
    print(f"  * Backend process running (PID: {backend_proc.pid})")

    # Launch Frontend
    print(f"\n[3/4] Starting React Frontend (http://localhost:{FRONTEND_PORT})...")
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR)
    )
    print(f"  * Frontend process running (PID: {frontend_proc.pid})")

    # Wait for services
    print("\n[4/4] Verifying connectivity...")
    b_ok = wait_for_service(BACKEND_PORT, max_wait=12)
    f_ok = wait_for_service(FRONTEND_PORT, max_wait=12)

    if b_ok:
        print(f"  [OK] Backend responding on http://{BACKEND_HOST}:{BACKEND_PORT}")
    else:
        print(f"  [WAIT] Backend is initializing...")

    if f_ok:
        print(f"  [OK] Frontend responding on http://localhost:{FRONTEND_PORT}")
    else:
        print(f"  [WAIT] Frontend is compiling...")

    print("\n" + "=" * 70)
    print("  FlowTrack is ready for use!")
    print("=" * 70)
    print("  * Application UI : http://localhost:5173")
    print("  * REST API Root  : http://127.0.0.1:8000/api/")
    print("  * Django Admin   : http://127.0.0.1:8000/admin/")
    print("\n  Pre-seeded Demo Accounts (Password: password123):")
    print("    - Organization Owner : owner@flowtrack.test")
    print("    - Project Manager    : manager@flowtrack.test")
    print("    - Team Member        : member@flowtrack.test")
    print("\n  [PRESS Ctrl + C IN THIS TERMINAL TO STOP ALL SERVERS]")
    print("=" * 70 + "\n")

    if not no_browser:
        time.sleep(1)
        webbrowser.open(f"http://localhost:{FRONTEND_PORT}")

    # Process monitor loop
    try:
        while True:
            if backend_proc.poll() is not None:
                print(f"\n[ALERT] Django Backend stopped (code: {backend_proc.returncode})")
                break
            if frontend_proc.poll() is not None:
                print(f"\n[ALERT] React Frontend stopped (code: {frontend_proc.returncode})")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup_and_exit()


def parse_args():
    parser = argparse.ArgumentParser(description="FlowTrack Project Launcher")
    parser.add_argument("-w", "--windows", action="store_true", help="Launch in separate command prompt windows (Windows only)")
    parser.add_argument("--stop", action="store_true", help="Stop all running FlowTrack servers on ports 8000 & 5173")
    parser.add_argument("--status", action="store_true", help="Check status of FlowTrack services")
    parser.add_argument("--no-browser", action="store_true", help="Do not auto-open default browser on start")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.stop:
        stop_servers()
    elif args.status:
        check_status()
    elif args.windows and sys.platform == "win32":
        launch_in_windows()
    else:
        launch_unified(no_browser=args.no_browser)
