export function isUseCaseId(value) {
  return /^UC-\d{2}$/u.test(value);
}

export function isAcceptanceCriteriaId(value) {
  return /^AC-\d{2}$/u.test(value);
}

export function isTaskId(value) {
  return /^T-\d{2}$/u.test(value);
}

export function assertValidId(value, validator, message) {
  if (!validator(value)) {
    throw new Error(message);
  }
}
