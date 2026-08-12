from contextlib import contextmanager

from my_py_agents_agent_connection import StrandsS3McpServerClientStrands, log_model_errors, log_tool_errors
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
        yield Agent(
            name="StrandsS3A2aAgent",
            description="StrandsS3A2aAgent Strands Agent",
            system_prompt="""
You are a mathematical wizard.
Use your tools for mathematical tasks.
Refer to tools as your 'spellbook'.
""",
            tools=[subtract, current_time, *strands_s3_mcp_server.list_tools_sync()],
            hooks=[log_model_errors, log_tool_errors],
            session_manager=get_session_manager(),
        )
