pnpm exec nx generate @aws/nx-plugin:py#project --name=langchain_s3_agents --type=application --no-interactive

# A2A / HTTP / AGUI / MCP (LangChain, S3-backed sessions)
# NOTE: the py#agent generator's `session` option only supports `in-memory` today,
# so there's no --session=s3 flag to pass. After generation, wire each agent's
# get_checkpointer() (session.py) to a LangGraph checkpointer backed by S3
# (e.g. a custom BaseCheckpointSaver, or a community S3/DynamoDB checkpoint
# saver) so conversation state persists to S3 instead of in-memory/SQLite.
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_s3_agents --framework=langchain --name=LangchainS3HttpAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_s3_agents --framework=langchain --protocol=a2a --name=LangchainS3A2aAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_s3_agents --framework=langchain --protocol=ag-ui --name=LangchainS3AguiAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#mcp-server --project=my_py_agents.langchain_s3_agents --name=LangchainS3McpServer --no-interactive

# AGUI -> A2A / HTTP -> A2A
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_s3_agents --targetProject=my_py_agents.langchain_s3_agents --sourceComponent=langchain-s3-agui-agent --targetComponent=langchain-s3-a2a-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_s3_agents --targetProject=my_py_agents.langchain_s3_agents --sourceComponent=langchain-s3-http-agent --targetComponent=langchain-s3-a2a-agent --no-interactive

# Agents -> MCP
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_s3_agents --targetProject=my_py_agents.langchain_s3_agents --sourceComponent=langchain-s3-http-agent --targetComponent=langchain-s3-mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_s3_agents --targetProject=my_py_agents.langchain_s3_agents --sourceComponent=langchain-s3-a2a-agent --targetComponent=langchain-s3-mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_s3_agents --targetProject=my_py_agents.langchain_s3_agents --sourceComponent=langchain-s3-agui-agent --targetComponent=langchain-s3-mcp-server --no-interactive

# Website / Website Auth / Website -> AGUI
# NOTE: ts#website (like all TS-project generators) kebab-cases `name`, so the
# resulting Nx project is @my-py-agents/langchain-s3-website (hyphens), not the
# underscored form used by the Python `py#project`/`py#agent` generators above.
pnpm exec nx generate @aws/nx-plugin:ts#website --name=langchain-s3-website --no-interactive
pnpm exec nx generate @aws/nx-plugin:ts#website#auth --project=@my-py-agents/langchain-s3-website --allowSignup=true --cognitoDomain=langchain-s3-session-manager --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=@my-py-agents/langchain-s3-website --targetProject=my_py_agents.langchain_s3_agents --targetComponent=langchain-s3-agui-agent --no-interactive

# Infra (CDK app to deploy the agents, MCP server and website)
# NOTE: this vends an empty ApplicationStack. You still need to import and
# instantiate the generated constructs from packages/common/constructs
# (LangchainS3HttpAgent, LangchainS3A2aAgent, LangchainS3AguiAgent,
# LangchainS3McpServer, LangchainS3Website) inside src/stacks/application-stack.ts
# to deploy them.
pnpm exec nx generate @aws/nx-plugin:ts#infra --name=langchain-s3-infra --no-interactive
