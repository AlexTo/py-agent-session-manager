import os

from strands.tools.mcp.mcp_client import MCPClient

from my_py_agents_agent_connection.core.agentcore_mcp_client_strands import (
    AgentCoreMCPClientStrands,
)
from my_py_agents_agent_connection.core.runtime_config import (
    get_agentcore_runtime_config,
)


class StrandsAgentsMcpServerClientStrands:
    """Strands client for the StrandsAgentsMcpServer MCP server."""

    @staticmethod
    def create() -> MCPClient:
        if os.environ.get("LOCAL_DEV") == "true":
            return AgentCoreMCPClientStrands.without_auth("http://localhost:8000/mcp")
        config = get_agentcore_runtime_config()
        agent_runtime = config.get("agentRuntimes", {}).get("StrandsAgentsMcpServer")
        agent_runtime_arn = agent_runtime.get("arn") if agent_runtime else None
        if not agent_runtime_arn:
            raise RuntimeError(
                "No connected MCP server runtime named 'StrandsAgentsMcpServer' found in runtime configuration."
            )
        return AgentCoreMCPClientStrands.with_iam_auth(agent_runtime_arn)
