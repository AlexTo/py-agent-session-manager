from contextlib import contextmanager

from my_py_agents_agent_connection import (
    StrandsS3A2aAgentClientStrands,
    StrandsS3McpServerClientStrands,
    log_model_errors,
    log_tool_errors,
)
from strands import Agent, tool
from strands_tools import current_time

from .session import get_session_manager


@tool
def subtract(a: int, b: int) -> int:
    return a - b


@contextmanager
def get_agent():
    strands_s3_mcp_server = StrandsS3McpServerClientStrands.create()
    with (
        strands_s3_mcp_server,
    ):
        strands_s3_a2a_agent = StrandsS3A2aAgentClientStrands.create()

        @tool
        def ask_strands_s3_a2a_agent(prompt: str) -> str:
            """Delegate a question to the remote StrandsS3A2aAgent A2A agent and return its reply."""
            return str(strands_s3_a2a_agent(prompt))

        yield Agent(
            name="StrandsS3HttpAgent",
            description="StrandsS3HttpAgent Strands Agent",
            system_prompt="""
You are a mathematical wizard.
Use your tools for mathematical tasks.
Refer to tools as your 'spellbook'.
""",
            tools=[subtract, current_time, ask_strands_s3_a2a_agent, *strands_s3_mcp_server.list_tools_sync()],
            hooks=[log_model_errors, log_tool_errors],
            session_manager=get_session_manager(),
        )
