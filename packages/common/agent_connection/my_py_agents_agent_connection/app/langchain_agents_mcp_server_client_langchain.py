import os

from langchain_core.tools import BaseTool

from my_py_agents_agent_connection.core.agentcore_mcp_client_langchain import (
    AgentCoreMCPClientLangChain,
)
from my_py_agents_agent_connection.core.runtime_config import (
    get_agentcore_runtime_config,
)


class LangchainAgentsMcpServerClientLangChain:
    """Loads LangChain tools from the LangchainAgentsMcpServer MCP server."""

    @staticmethod
    def create() -> list[BaseTool]:
        if os.environ.get("LOCAL_DEV") == "true":
            return AgentCoreMCPClientLangChain.without_auth("http://localhost:8001/mcp")
        config = get_agentcore_runtime_config()
        agent_runtime = config.get("agentRuntimes", {}).get("LangchainAgentsMcpServer")
        agent_runtime_arn = agent_runtime.get("arn") if agent_runtime else None
        if not agent_runtime_arn:
            raise RuntimeError(
                "No connected MCP server runtime named 'LangchainAgentsMcpServer' found in runtime configuration."
            )
        return AgentCoreMCPClientLangChain.with_iam_auth(agent_runtime_arn)
