import os

from langchain.agents import create_agent
from langchain_aws import ChatBedrockConverse
from langchain_core.tools import tool
from langgraph.checkpoint.memory import InMemorySaver
from my_py_agents_agent_connection import LangchainAgentsMcpServerClientLangChain

REGION = os.environ.get("AWS_REGION", "us-east-1")
MODEL_ID = os.environ.get("MODEL_ID", "global.anthropic.claude-haiku-4-5-20251001-v1:0")


@tool
def subtract(a: int, b: int) -> int:
    """Subtract b from a."""
    return a - b


def get_agent():
    langchain_agents_mcp_server = LangchainAgentsMcpServerClientLangChain.create()
    model = ChatBedrockConverse(model=MODEL_ID, region_name=REGION)
    # Swap InMemorySaver for a durable checkpointer in a multi-replica deployment.
    return create_agent(
        model=model,
        tools=[subtract, *langchain_agents_mcp_server],
        system_prompt="""
You are a mathematical wizard.
Use your tools for mathematical tasks.
Refer to tools as your 'spellbook'.
""",
        checkpointer=InMemorySaver(),
    )
