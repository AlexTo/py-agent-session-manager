pnpm exec nx generate @aws/nx-plugin:py#project --name=langchain_dynamodb_agents --type=application --no-interactive

# A2A / HTTP / AGUI / MCP (LangChain, DynamoDB-backed sessions)
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_dynamodb_agents --framework=langchain --session=dynamodb-s3 --name=LangchainDynamodbHttpAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_dynamodb_agents --framework=langchain --session=dynamodb-s3 --protocol=a2a --name=LangchainDynamodbA2aAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_dynamodb_agents --framework=langchain --session=dynamodb-s3 --protocol=ag-ui --name=LangchainDynamodbAguiAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#mcp-server --project=my_py_agents.langchain_dynamodb_agents --name=LangchainDynamodbMcpServer --no-interactive

# AGUI -> A2A / HTTP -> A2A
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_dynamodb_agents --targetProject=my_py_agents.langchain_dynamodb_agents --sourceComponent=langchain-dynamodb-agui-agent --targetComponent=langchain-dynamodb-a2a-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_dynamodb_agents --targetProject=my_py_agents.langchain_dynamodb_agents --sourceComponent=langchain-dynamodb-http-agent --targetComponent=langchain-dynamodb-a2a-agent --no-interactive

# Agents -> MCP
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_dynamodb_agents --targetProject=my_py_agents.langchain_dynamodb_agents --sourceComponent=langchain-dynamodb-http-agent --targetComponent=langchain-dynamodb-mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_dynamodb_agents --targetProject=my_py_agents.langchain_dynamodb_agents --sourceComponent=langchain-dynamodb-a2a-agent --targetComponent=langchain-dynamodb-mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_dynamodb_agents --targetProject=my_py_agents.langchain_dynamodb_agents --sourceComponent=langchain-dynamodb-agui-agent --targetComponent=langchain-dynamodb-mcp-server --no-interactive

# Website / Website Auth / Website -> AGUI
# NOTE: ts#website (like all TS-project generators) kebab-cases `name`, so the
# resulting Nx project is @my-py-agents/langchain-dynamodb-website (hyphens),
# not the underscored form used by the Python `py#project`/`py#agent`
# generators above.
pnpm exec nx generate @aws/nx-plugin:ts#website --name=langchain-dynamodb-website --no-interactive
pnpm exec nx generate @aws/nx-plugin:ts#website#auth --project=@my-py-agents/langchain-dynamodb-website --allowSignup=true --cognitoDomain=langchain-dynamodb-session-manager --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=@my-py-agents/langchain-dynamodb-website --targetProject=my_py_agents.langchain_dynamodb_agents --targetComponent=langchain-dynamodb-agui-agent --no-interactive

pnpm exec nx generate @aws/nx-plugin:ts#infra --name=langchain-dynamodb-infra --no-interactive
