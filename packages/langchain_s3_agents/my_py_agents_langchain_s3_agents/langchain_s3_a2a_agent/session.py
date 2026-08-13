import os

import aiosqlite
import boto3
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from my_py_agents_agent_connection.core.runtime_config import get_agentcore_runtime_config
from my_py_agents_agent_connection.core.s3_checkpoint_saver_langchain import S3CheckpointSaver


def get_checkpointer() -> BaseCheckpointSaver:
    """Returns a LangGraph checkpointer for persisting conversation state across
    invocations. Local development always uses a local SQLite database for
    convenience, regardless of the configured session option. Swap this for a
    durable BaseCheckpointSaver implementation if you need state to survive
    process restarts or scale-in when deployed.
    """
    if os.environ.get("LOCAL_DEV") == "true":
        os.makedirs("../../tmp/agents/langchain/langchain-s3-a2a-agent", exist_ok=True)
        conn = aiosqlite.connect(
            os.path.join("../../tmp/agents/langchain/langchain-s3-a2a-agent", "checkpoints.sqlite")
        )
        return AsyncSqliteSaver(conn)
    config = get_agentcore_runtime_config()
    session_config = (config.get("agentRuntimes") or {}).get("LangchainS3A2aAgent", {}).get("session", {})
    bucket_name = session_config.get("bucketName")
    if not bucket_name:
        raise RuntimeError("No S3 checkpoint bucket configured for this agent in runtime configuration.")
    return S3CheckpointSaver(
        bucket_name=bucket_name,
        prefix="checkpoints/",
        s3_client=boto3.client("s3"),
    )
