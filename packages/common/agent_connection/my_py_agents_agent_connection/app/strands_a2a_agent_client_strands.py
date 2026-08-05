import os

from strands.agent.a2a_agent import A2AAgent

from my_py_agents_agent_connection.core.agentcore_a2a_client_strands import (
    AgentCoreA2aClientStrands,
)
from my_py_agents_agent_connection.core.runtime_config import (
    get_agentcore_runtime_config,
)


class StrandsA2aAgentClientStrands:
    """Strands client for the StrandsA2aAgent A2A agent."""

    @staticmethod
    def create() -> A2AAgent:
        if os.environ.get("LOCAL_DEV") == "true":
            return AgentCoreA2aClientStrands.without_auth("http://localhost:9000/")
        config = get_agentcore_runtime_config()
        agent_runtime = config.get("agentRuntimes", {}).get("StrandsA2aAgent")
        agent_runtime_arn = agent_runtime.get("arn") if agent_runtime else None
        if not agent_runtime_arn:
            raise RuntimeError("No connected agent runtime named 'StrandsA2aAgent' found in runtime configuration.")
        return AgentCoreA2aClientStrands.with_iam_auth(agent_runtime_arn)
