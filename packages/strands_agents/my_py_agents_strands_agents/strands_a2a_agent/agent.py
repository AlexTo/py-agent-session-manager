from contextlib import contextmanager

from my_py_agents_agent_connection import StrandsAgentsMcpServerClientStrands, log_model_errors
from strands import Agent, tool
from strands_tools import current_time


@tool
def subtract(a: int, b: int) -> int:
    return a - b


@contextmanager
def get_agent():
    strands_agents_mcp_server = StrandsAgentsMcpServerClientStrands.create()
    with (
        strands_agents_mcp_server,
    ):
        yield Agent(
            name="StrandsA2aAgent",
            description="StrandsA2aAgent Strands Agent",
            system_prompt="""
You are a mathematical wizard.
Use your tools for mathematical tasks.
Refer to tools as your 'spellbook'.
""",
            tools=[subtract, current_time, *strands_agents_mcp_server.list_tools_sync()],
            hooks=[log_model_errors],
        )
