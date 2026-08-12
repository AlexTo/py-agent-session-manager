import os
import sqlite3

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver


def get_checkpointer() -> BaseCheckpointSaver:
    """Returns the checkpointer used to persist conversation state."""
    if os.environ.get("LOCAL_DEV") == "true":
        os.makedirs("../../tmp/agents/langchain/langchain-agui-agent", exist_ok=True)
        conn = sqlite3.connect(
            os.path.join("../../tmp/agents/langchain/langchain-agui-agent", "checkpoints.sqlite"),
            check_same_thread=False,
        )
        return SqliteSaver(conn)
    return InMemorySaver()
