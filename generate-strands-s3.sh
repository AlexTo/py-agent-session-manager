pnpm exec nx generate @aws/nx-plugin:py#project --name=strands_s3_agents --type=application --no-interactive

# A2A / HTTP / AGUI / MCP (Strands, S3-backed sessions)
# NOTE: the py#agent generator's `session` option only supports `in-memory` today,
# so there's no --session=s3 flag to pass. After generation, wire each agent.py's
# `Agent(...)` to a Strands S3-backed session manager so conversation state
# persists to S3 instead of in-memory:
# https://strandsagents.com/docs/user-guide/concepts/agents/session-management/
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.strands_s3_agents --name=StrandsS3HttpAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.strands_s3_agents --protocol=a2a --name=StrandsS3A2aAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#agent --project=my_py_agents.strands_s3_agents --protocol=ag-ui --name=StrandsS3AguiAgent --no-interactive
pnpm exec nx generate @aws/nx-plugin:py#mcp-server --project=my_py_agents.strands_s3_agents --name=StrandsS3McpServer --no-interactive

# AGUI -> A2A / HTTP -> A2A
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_s3_agents --targetProject=my_py_agents.strands_s3_agents --sourceComponent=strands-s3-agui-agent --targetComponent=strands-s3-a2a-agent --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_s3_agents --targetProject=my_py_agents.strands_s3_agents --sourceComponent=strands-s3-http-agent --targetComponent=strands-s3-a2a-agent --no-interactive

# Agents -> MCP
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_s3_agents --targetProject=my_py_agents.strands_s3_agents --sourceComponent=strands-s3-http-agent --targetComponent=strands-s3-mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_s3_agents --targetProject=my_py_agents.strands_s3_agents --sourceComponent=strands-s3-a2a-agent --targetComponent=strands-s3-mcp-server --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=my_py_agents.strands_s3_agents --targetProject=my_py_agents.strands_s3_agents --sourceComponent=strands-s3-agui-agent --targetComponent=strands-s3-mcp-server --no-interactive

# Website / Website Auth / Website -> AGUI
# NOTE: ts#website (like all TS-project generators) kebab-cases `name`, so the
# resulting Nx project is @my-py-agents/strands-s3-website (hyphens), not the
# underscored form used by the Python `py#project`/`py#agent` generators above.
pnpm exec nx generate @aws/nx-plugin:ts#website --name=strands-s3-website --no-interactive
pnpm exec nx generate @aws/nx-plugin:ts#website#auth --project=@my-py-agents/strands-s3-website --allowSignup=true --cognitoDomain=strands-s3-session-manager --no-interactive
pnpm exec nx generate @aws/nx-plugin:connection --sourceProject=@my-py-agents/strands-s3-website --targetProject=my_py_agents.strands_s3_agents --targetComponent=strands-s3-agui-agent --no-interactive

# Infra (CDK app to deploy the agents, MCP server and website)
# NOTE: this vends an empty ApplicationStack. You still need to import and
# instantiate the generated constructs from packages/common/constructs
# (StrandsS3HttpAgent, StrandsS3A2aAgent, StrandsS3AguiAgent, StrandsS3McpServer,
# StrandsS3Website) inside src/stacks/application-stack.ts to deploy them.
pnpm exec nx generate @aws/nx-plugin:ts#infra --name=strands-s3-infra --no-interactive
