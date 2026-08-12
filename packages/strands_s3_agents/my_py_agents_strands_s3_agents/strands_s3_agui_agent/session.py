import os

from my_py_agents_agent_connection import get_current_session_id
from my_py_agents_agent_connection.core.runtime_config import get_agentcore_runtime_config
from strands.session import FileSessionManager, S3SessionManager, SessionManager


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
        return FileSessionManager(session_id=session_id, storage_dir="../../tmp/agents/strands/strands-s3-agui-agent")
    config = get_agentcore_runtime_config()
    bucket_name = (config.get("agentRuntimes") or {}).get("StrandsS3AguiAgent", {}).get("session", {}).get("bucketName")
    if not bucket_name:
        raise RuntimeError("No S3 bucket configured for this agent's session in runtime configuration.")
    return S3SessionManager(session_id=session_id, bucket=bucket_name)
