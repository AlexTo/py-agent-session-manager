from contextlib import contextmanager

from my_py_agents_agent_connection import (
    StrandsA2aAgentClientStrands,
    StrandsAgentsMcpServerClientStrands,
    log_model_errors,
    log_tool_errors,
)
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
        strands_a2a_agent = StrandsA2aAgentClientStrands.create()

        @tool
        def ask_strands_a2a_agent(prompt: str) -> str:
            """Delegate a question to the remote StrandsA2aAgent A2A agent and return its reply."""
            return str(strands_a2a_agent(prompt))

        yield Agent(
            name="StrandsAguiAgent",
            description="StrandsAguiAgent Strands Agent",
            system_prompt="""
You are a mathematical wizard.
Use your tools for mathematical tasks.
Refer to tools as your 'spellbook'.
""",
            tools=[subtract, current_time, ask_strands_a2a_agent, *strands_agents_mcp_server.list_tools_sync()],
            hooks=[log_model_errors, log_tool_errors],
        )
