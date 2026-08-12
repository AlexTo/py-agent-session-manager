FROM public.ecr.aws/docker/library/python:3.14-slim

# Remove the base image's pip: the agent runs from the bundled environment and
# never needs it at runtime, and pip's vendored packages carry known
# HIGH/CRITICAL vulnerabilities flagged by the image scan.
RUN python -m pip uninstall -y pip && \
    rm -rf /usr/local/lib/python*/site-packages/pip \
           /usr/local/lib/python*/site-packages/pip-*.dist-info

WORKDIR /app

# Copy bundled package
COPY . /app

EXPOSE 8080

ENV PYTHONPATH=/app
ENV PATH="/app/bin:${PATH}"

# Auto-instrument with AWS Distro for OpenTelemetry
# https://aws-otel.github.io/docs/getting-started/python-sdk/auto-instr
CMD ["python", "bin/opentelemetry-instrument", "python", "-m", "my_py_agents_strands_s3_agents.strands_s3_http_agent.main"]
