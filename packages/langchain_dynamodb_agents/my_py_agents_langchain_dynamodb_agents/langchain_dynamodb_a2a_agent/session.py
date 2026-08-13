import os

import aiosqlite
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph_checkpoint_aws import DynamoDBSaver
from my_py_agents_agent_connection.core.runtime_config import get_agentcore_runtime_config


def get_checkpointer() -> BaseCheckpointSaver:
    """Returns a LangGraph checkpointer for persisting conversation state across
    invocations. Local development always uses a local SQLite database for
    convenience, regardless of the configured session option.
    """
    if os.environ.get("LOCAL_DEV") == "true":
        os.makedirs("../../tmp/agents/langchain/langchain-dynamodb-a2a-agent", exist_ok=True)
        conn = aiosqlite.connect(
            os.path.join("../../tmp/agents/langchain/langchain-dynamodb-a2a-agent", "checkpoints.sqlite")
        )
        return AsyncSqliteSaver(conn)
    config = get_agentcore_runtime_config()
    session_config = (config.get("agentRuntimes") or {}).get("LangchainDynamodbA2aAgent", {}).get("session", {})
    table_name = session_config.get("tableName")
    bucket_name = session_config.get("bucketName")
    if not table_name or not bucket_name:
        raise RuntimeError(
            "No DynamoDB checkpoint table or S3 offload bucket configured for this agent in runtime configuration."
        )
    return DynamoDBSaver(
        table_name=table_name,
        region_name=os.environ.get("AWS_REGION"),
        s3_offload_config={"bucket_name": bucket_name},
    )
