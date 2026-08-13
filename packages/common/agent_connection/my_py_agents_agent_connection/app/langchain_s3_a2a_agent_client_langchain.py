import os

from my_py_agents_agent_connection.core.agentcore_a2a_client_langchain import (
    AgentCoreA2aClientLangChain,
)
from my_py_agents_agent_connection.core.runtime_config import (
    get_agentcore_runtime_config,
)


class LangchainS3A2aAgentClientLangChain:
    """LangChain client for the LangchainS3A2aAgent A2A agent."""

    @staticmethod
    def create():
        if os.environ.get("LOCAL_DEV") == "true":
            return AgentCoreA2aClientLangChain.without_auth("http://localhost:9003/")
        config = get_agentcore_runtime_config()
        agent_runtime = config.get("agentRuntimes", {}).get("LangchainS3A2aAgent")
        agent_runtime_arn = agent_runtime.get("arn") if agent_runtime else None
        if not agent_runtime_arn:
            raise RuntimeError("No connected agent runtime named 'LangchainS3A2aAgent' found in runtime configuration.")
        return AgentCoreA2aClientLangChain.with_iam_auth(agent_runtime_arn)
