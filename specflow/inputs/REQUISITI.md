# REQUIREMENTS

## Meta
- name: specflow-seed
- version: 0.1.0
- updatedAt: 2024-04-01

## Functional Requirements
### RQ-01 - Create to-do
A user can create a task by providing a title and an optional description.
- AC: AC-01, AC-02

## Non Functional Requirements
### RQ-02 - Response time
API response < 500ms for 95% of the requests.

## Use Cases
### UC-01 - User registers a new to-do
- Actor: Authenticated user
The user provides a title and optionally a description to create a to-do.
