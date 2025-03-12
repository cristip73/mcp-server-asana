/**
 * Error handling utilities for Asana API
 * Provides enhanced error messages and recovery suggestions
 */

/**
 * Interface for error mapping
 */
export interface ErrorMapping {
  pattern: RegExp;
  friendlyMessage: string;
  recoverySteps?: string[];
  errorCode?: string;
}

/**
 * Common error patterns mapped to user-friendly messages and recovery steps
 */
export const errorMappings: ErrorMapping[] = [
  // General "Not Found" error
  {
    pattern: /not\s+found|resource.+?not\s+found/i,
    friendlyMessage: "The specified resource doesn't exist or you don't have access to it",
    recoverySteps: [
      "Check that the ID is correct",
      "Verify that you have access to this resource",
      "Make sure the resource hasn't been deleted"
    ],
    errorCode: "RESOURCE_NOT_FOUND"
  },
  // Task-related errors
  {
    pattern: /not\s+a\s+valid\s+task|task.+?not\s+found/i,
    friendlyMessage: "The specified task ID doesn't exist or you don't have access to it",
    recoverySteps: [
      "Verify the task ID is correct",
      "Check that you have access to the task",
      "Make sure the task hasn't been deleted"
    ],
    errorCode: "INVALID_TASK"
  },
  // Project-related errors
  {
    pattern: /not\s+a\s+valid\s+project|project.+?not\s+found/i,
    friendlyMessage: "The specified project ID doesn't exist or you don't have access to it",
    recoverySteps: [
      "Verify the project ID is correct",
      "Check that you have access to the project",
      "Make sure the project hasn't been deleted"
    ],
    errorCode: "INVALID_PROJECT"
  },
  // Workspace-related errors
  {
    pattern: /not\s+a\s+valid\s+workspace|workspace.+?not\s+found/i,
    friendlyMessage: "The specified workspace ID doesn't exist or you don't have access to it",
    recoverySteps: [
      "Verify the workspace ID is correct",
      "Ensure you have access to the workspace"
    ],
    errorCode: "INVALID_WORKSPACE"
  },
  // User-related errors
  {
    pattern: /not\s+a\s+valid\s+user|user.+?not\s+found/i,
    friendlyMessage: "The specified user ID doesn't exist or you don't have access to user information",
    recoverySteps: [
      "Verify the user ID is correct",
      "Check that the user is a member of the workspace"
    ],
    errorCode: "INVALID_USER"
  },
  // Authentication errors
  {
    pattern: /not\s+authorized|unauthorized|invalid.*?token/i,
    friendlyMessage: "Authentication failed. Your access token may be invalid or expired",
    recoverySteps: [
      "Check that your Asana access token is valid",
      "Generate a new personal access token if needed",
      "Ensure the token has the required permissions"
    ],
    errorCode: "AUTH_ERROR"
  },
  // Permission errors
  {
    pattern: /permission|not\s+allowed|forbidden/i,
    friendlyMessage: "You don't have permission to perform this action",
    recoverySteps: [
      "Request necessary permissions from a workspace admin",
      "Use a different account with appropriate permissions"
    ],
    errorCode: "PERMISSION_DENIED"
  },
  // Rate limiting
  {
    pattern: /rate\s+limit|too\s+many\s+requests/i,
    friendlyMessage: "You've exceeded Asana's rate limits",
    recoverySteps: [
      "Wait a moment before trying again",
      "Reduce the frequency of your requests",
      "Implement request throttling in your application"
    ],
    errorCode: "RATE_LIMITED"
  },
  // Invalid parameter errors
  {
    pattern: /invalid\s+parameter|missing\s+input/i,
    friendlyMessage: "One or more parameters are invalid or missing",
    recoverySteps: [
      "Check the required parameters for this operation",
      "Ensure all parameters have the correct format"
    ],
    errorCode: "INVALID_PARAMETER"
  },
  // Custom field errors
  {
    pattern: /custom\s+field|enum\s+option/i,
    friendlyMessage: "There was an issue with a custom field",
    recoverySteps: [
      "Verify the custom field GIDs are correct",
      "For enum fields, ensure you're using the enum option GID, not just the name",
      "Check that the data type matches the custom field type"
    ],
    errorCode: "CUSTOM_FIELD_ERROR"
  },
  // Server errors
  {
    pattern: /server\s+error|internal\s+error/i,
    friendlyMessage: "Asana encountered an internal server error",
    recoverySteps: [
      "Try your request again after a few moments",
      "If the error persists, contact Asana support with the error phrase"
    ],
    errorCode: "SERVER_ERROR"
  }
];

/**
 * Enhances an error message with user-friendly information and recovery steps
 * @param error The original error object or message
 * @returns An enhanced error object with friendly message and recovery steps
 */
export function enhanceErrorMessage(error: any): {
  originalMessage: string;
  friendlyMessage: string;
  recoverySteps?: string[];
  errorCode?: string;
} {
  // Extract the error message
  let originalMessage = '';
  
  // Handle different error formats
  if (error instanceof Error) {
    originalMessage = error.message;
  } else if (typeof error === 'string') {
    originalMessage = error;
  } else if (error?.response?.body?.errors?.[0]?.message) {
    originalMessage = error.response.body.errors[0].message;
  } else if (error?.response?.body?.error) {
    originalMessage = error.response.body.error;
  } else if (typeof error?.error === 'string') {
    originalMessage = error.error;
  } else if (error?.message) {
    originalMessage = error.message;
  } else {
    originalMessage = 'Unknown error';
  }

  // Check for phrase which appears in server errors
  const phrase = error?.response?.body?.errors?.[0]?.phrase;
  
  // Simple errors like "Not Found" need more context
  if (originalMessage === "Not Found") {
    originalMessage = "The requested resource was not found";
  }
  
  // Try to match the error with known patterns
  for (const mapping of errorMappings) {
    if (mapping.pattern.test(originalMessage)) {
      return {
        originalMessage,
        friendlyMessage: mapping.friendlyMessage,
        recoverySteps: mapping.recoverySteps,
        errorCode: mapping.errorCode,
        ...(phrase && { phrase }) // Include phrase if it exists
      };
    }
  }

  // Return a generic enhanced message if no specific pattern matches
  return {
    originalMessage,
    friendlyMessage: "An error occurred while communicating with Asana",
    recoverySteps: [
      "Check your inputs and try again",
      "Verify that the resource ID is correct",
      "Make sure you have the necessary permissions",
      "If the error persists, try again later"
    ],
    errorCode: "GENERAL_ERROR",
    ...(phrase && { phrase }) // Include phrase if it exists
  };
}

/**
 * Formats an enhanced error object as a JSON string for API responses
 * @param error The original error object or message
 * @returns A formatted JSON string with enhanced error information
 */
export function formatErrorResponse(error: any): string {
  const enhancedError = enhanceErrorMessage(error);
  return JSON.stringify(enhancedError, null, 2);
} 