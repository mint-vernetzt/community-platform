import { createForm } from "remix-forms";
// For Remix, import it like this
import {
  Form as FrameworkForm,
  useActionData,
  useSubmit,
  useNavigation,
} from "@remix-run/react";

const Form = createForm({
  component: FrameworkForm,
  useNavigation,
  useSubmit,
  useActionData,
});

export { Form as RemixFormsForm };
