pnpm exec nx generate @aws/nx-plugin:py#project --name=strands-agents --type=application --no-interactive

# A2A / HTTP / AGUI / MCP (Strands)
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.strands_agents --name=StrandsHttpAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.strands_agents --protocol=a2a --name=StrandsA2aAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.strands_agents --protocol=ag-ui --name=StrandsAguiAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#mcp-server --project=my_py_agents.strands_agents --no-interactive

# AGUI -> A2A / HTTP -> A2A
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_agents --targetProject=my_py_agents.strands_agents --sourceComponent=strands-agui-agent --targetComponent=strands-a2a-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_agents --targetProject=my_py_agents.strands_agents --sourceComponent=strands-http-agent --targetComponent=strands-a2a-agent --no-interactive

# Agents -> MCP
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_agents --targetProject=my_py_agents.strands_agents --sourceComponent=strands-http-agent --targetComponent=mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_agents --targetProject=my_py_agents.strands_agents --sourceComponent=strands-a2a-agent --targetComponent=mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_agents --targetProject=my_py_agents.strands_agents --sourceComponent=strands-agui-agent --targetComponent=mcp-server --no-interactive

pnpm exec nx generate @aws/nx-plugin:py#project --name=langchain-agents --type=application --no-interactive

# A2A / HTTP / AGUI / MCP (LangChain)
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_agents --framework=langchain --name=LangchainHttpAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_agents --framework=langchain --protocol=a2a --name=LangchainA2aAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.langchain_agents --framework=langchain --protocol=ag-ui --name=LangchainAguiAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#mcp-server --project=my_py_agents.langchain_agents --no-interactive

# AGUI -> A2A / HTTP -> A2A
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_agents --targetProject=my_py_agents.langchain_agents --sourceComponent=langchain-agui-agent --targetComponent=langchain-a2a-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_agents --targetProject=my_py_agents.langchain_agents --sourceComponent=langchain-http-agent --targetComponent=langchain-a2a-agent --no-interactive

# Agents -> MCP
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_agents --targetProject=my_py_agents.langchain_agents --sourceComponent=langchain-http-agent --targetComponent=mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_agents --targetProject=my_py_agents.langchain_agents --sourceComponent=langchain-a2a-agent --targetComponent=mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.langchain_agents --targetProject=my_py_agents.langchain_agents --sourceComponent=langchain-agui-agent --targetComponent=mcp-server --no-interactive

# Website / Website Auth / Website -> AGUI / Website -> HTTP
pnpm exec nx generate @aws/nx-plugin:ts#website --name=website --no-interactive
pnpm exec nx generate @aws/nx-plugin:ts#website#auth --project=@my-py-agents/website --allowSignup=true --cognitoDomain=ts-session-manager --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=@my-py-agents/website --targetProject=my_py_agents.strands_agents --targetComponent=strands-agui-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=@my-py-agents/website --targetProject=my_py_agents.strands_agents --targetComponent=strands-http-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=@my-py-agents/website --targetProject=my_py_agents.langchain_agents --targetComponent=langchain-agui-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=@my-py-agents/website --targetProject=my_py_agents.langchain_agents --targetComponent=langchain-http-agent --no-interactive
