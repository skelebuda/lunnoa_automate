import { createDatabaseConnection, createTextInputField } from "@lunnoa-automate/toolkit";

export const postgresqlConnection = createDatabaseConnection({
  id: "postgresql_connection",
  name: "PostgreSQL",
  description: "Connect to your PostgreSQL database",
  inputConfig: [
    createTextInputField({
      id: "host",
      label: "Host",
      description: "The hostname or IP address of your PostgreSQL server",
      required: {
        missingMessage: "Host is required",
        missingStatus: "error",
      },
    }),
    createTextInputField({
      id: "port",
      label: "Port",
      description: "The port number your PostgreSQL server is running on",
      defaultValue: "5432",
      required: {
        missingMessage: "Port is required",
        missingStatus: "error",
      },
    }),
    createTextInputField({
      id: "database",
      label: "Database",
      description: "The name of the database to connect to",
      required: {
        missingMessage: "Database is required",
        missingStatus: "error",
      },
    }),
    createTextInputField({
      id: "username",
      label: "Username",
      description: "Your PostgreSQL username",
      required: {
        missingMessage: "Username is required",
        missingStatus: "error",
      },
    }),
    createTextInputField({
      id: "password",
      label: "Password",
      description: "Your PostgreSQL password",
      required: {
        missingMessage: "Password is required",
        missingStatus: "error",
      },
    }),
  ],
}); 