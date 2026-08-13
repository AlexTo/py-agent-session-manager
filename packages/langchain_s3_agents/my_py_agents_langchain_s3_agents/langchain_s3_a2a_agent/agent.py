import os

from langchain.agents import create_agent
from langchain_aws import ChatBedrockConverse
from langchain_core.tools import tool
from my_py_agents_agent_connection import LangchainS3McpServerClientLangChain

from .session import get_checkpointer

REGION = os.environ.get("AWS_REGION", "us-east-1")
MODEL_ID = os.environ.get("MODEL_ID", "global.anthropic.claude-haiku-4-5-20251001-v1:0")


@tool
def subtract(a: int, b: int) -> int:
    """Subtract b from a."""
    return a - b


def get_agent():
    langchain_s3_mcp_server = LangchainS3McpServerClientLangChain.create()
    model = ChatBedrockConverse(model=MODEL_ID, region_name=REGION)
    return create_agent(
        model=model,
        tools=[subtract, *langchain_s3_mcp_server],
        system_prompt="""
You are a mathematical wizard.
Use your tools for mathematical tasks.
Refer to tools as your 'spellbook'.
""",
        checkpointer=get_checkpointer(),
    )
