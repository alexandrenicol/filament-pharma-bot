# Filament.ai test - pharma annual leave bot.

## Uses

- Typescript
- Slack Web API
- Dialogflow SDK
- AWS SDK (API Gateway, Lambda, SQS, DynamoDB)
- Luxon (DateTime)

## Dev

- ESLint
- Typescript
- Prettier
- Jest
- Webpack

## requirements

- node/npm
- aws account
- aws cli
- serverless
- a slack app (bot, interactive components, events listener configured) and a slack token
- a dialogflow/GCP client configuration file

## deploy

- configure your aws cli with the right profile
- add your slack token to the .env file
- add you GCP configuration file in the `src` folder
- deploy `sls deploy --profile [aws-profile]`
