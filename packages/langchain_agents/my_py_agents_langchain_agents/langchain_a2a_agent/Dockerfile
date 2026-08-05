FROM public.ecr.aws/docker/library/python:3.14-slim

WORKDIR /app

# Copy bundled package
COPY . /app

EXPOSE 9000

ENV PYTHONPATH=/app
ENV PATH="/app/bin:${PATH}"

# Auto-instrument with AWS Distro for OpenTelemetry
# https://aws-otel.github.io/docs/getting-started/python-sdk/auto-instr
CMD ["python", "bin/opentelemetry-instrument", "python", "-m", "uvicorn", "my_py_agents_langchain_agents.langchain_a2a_agent.main:app", "--host", "0.0.0.0", "--port", "9000"]
