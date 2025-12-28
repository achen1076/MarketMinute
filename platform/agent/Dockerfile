FROM public.ecr.aws/lambda/nodejs:20

WORKDIR ${LAMBDA_TASK_ROOT}

# Copy pre-built bundle (built by deploy script)
COPY dist/handler.js ./dist/handler.js

# Copy prisma client from MCP package
COPY dist/prisma ./node_modules/.prisma
COPY dist/@prisma ./node_modules/@prisma

# Set handler
CMD ["dist/handler.handler"]
