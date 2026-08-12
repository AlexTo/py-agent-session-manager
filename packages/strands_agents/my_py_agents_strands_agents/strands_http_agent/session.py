import os

from my_py_agents_agent_connection import get_current_session_id
from strands.session import FileSessionManager, SessionManager


def get_session_manager() -> SessionManager | None:
    """Returns a SessionManager for persisting conversation state across
    invocations. Local development always uses local file storage for
    convenience, regardless of the configured session option. Without a
    configured session option, conversation state is kept in memory only and
    does not survive process restarts.
    """
    session_id = get_current_session_id()
    if not session_id:
        raise RuntimeError("No current session id — cannot resolve a SessionManager outside of a request scope.")
    if os.environ.get("LOCAL_DEV") == "true":
        return FileSessionManager(session_id=session_id, storage_dir="../../tmp/agents/strands/strands-http-agent")
    return None
