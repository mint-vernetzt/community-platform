// multiple forms

import { Organization, OrganizationType } from "@prisma/client";
import React, { useEffect } from "react";
import {
  ActionFunction,
  LoaderFunction,
  useActionData,
  useFetcher,
  useLoaderData,
  useParams,
  useSubmit,
} from "remix";
import { makeDomainFunction } from "remix-domains";
import { Form, performMutation } from "remix-forms";
import { badRequest } from "remix-utils";
import { z } from "zod";
import {
  getOrganizationBySlug,
  getOrganizationTypes,
} from "./general2/utils.server";

const schema: toZod<> = z.late.object();

const mutation = makeDomainFunction(schema)(async (values) => {
  console.log("values", values);
  return values;
});

type LoaderData = {
  organization: Organization & {
    types: string[];
  };
  organizationTypes: OrganizationType[];
  types: string[];
};

export const loader: LoaderFunction = async (args) => {
  const { params } = args;
  const { slug } = params;

  if (slug === undefined) {
    throw badRequest({ message: 'Parameter "slug" is missing' });
  }

  const organization = await getOrganizationBySlug(slug);

  if (organization === null) {
    return null;
  }

  const organizationTypes = await getOrganizationTypes();

  const organizationTypeIds = organization.types.map((type) => {
    return type.organizationTypeId;
  });

  return {
    organization: { ...organization, types: organizationTypeIds },
    organizationTypes,
  };
};

export const action: ActionFunction = async (args) => {
  const { request } = args;

  const formData = await request.clone().formData();
  console.log(formData.get("types"));

  const result = await performMutation({ schema, mutation, request });
  return result;
};

function General() {
  const loaderData = useLoaderData<LoaderData>();

  // const [jsAvailable, setJsAvailable] = React.useState(false);

  // useEffect(() => {
  //   setJsAvailable(true);
  // }, []);

  const fetcher = useFetcher();

  let types = loaderData.organization.types;
  if (fetcher.data && fetcher.data.types.length > 0) {
    types = fetcher.data.types;
  }

  const selectedOrganizationTypes = loaderData.organizationTypes.filter(
    (type) => {
      return types.includes(type.id);
    }
  );

  const organizationTypeOptions = loaderData.organizationTypes.filter(
    (type) => {
      return types.includes(type.id) === false;
    }
  );

  return (
    <>
      <Form schema={schema} values={{ ...loaderData, types }}>
        {(props) => {
          const { Field, Button, Error } = props;
          return (
            <>
              <Field name="types" hidden />
              <select
                onChange={(event) => {
                  const values = types
                    .concat([event.target.value])
                    .join("&value=");
                  fetcher.load(`/field?name=types&value=${values}`);
                }}
              >
                <option></option>
                {organizationTypeOptions.map((type) => {
                  return (
                    <option key={type.id} value={type.id}>
                      {type.title}
                    </option>
                  );
                })}
              </select>
              <ul>
                {selectedOrganizationTypes.map((type) => {
                  return <li key={type.id}>{type.title}</li>;
                })}
              </ul>
              <Error />
              <Button>Submit</Button>
            </>
          );
        }}
      </Form>
    </>
    // <Form schema={schema} values={{ ...loaderData, types }} name="test">
    //   {(props) => {
    //     const { Field, Button, Error } = props;
    //     return (
    //       <>
    //         <Field name="types">
    //           {(props) => {
    //             return jsAvailable ? (
    //               <>
    //                 <select
    //                   onChange={(event) => {
    //                     const values = types
    //                       .concat([event.target.value])
    //                       .join("&value=");
    //                     fetcher.load(
    //                       `/organization/${slug}/settings/general2/field?name=types&value=${values}`
    //                     );
    //                   }}
    //                 >
    //                   <option></option>
    //                   {organizationTypeOptions.map((type) => {
    //                     return (
    //                       <option key={type.id} value={type.id}>
    //                         {type.title}
    //                       </option>
    //                     );
    //                   })}
    //                 </select>
    //                 <ul>
    //                   {selectedOrganizationTypes.map((type) => {
    //                     return <li key={type.id}>{type.title}</li>;
    //                   })}
    //                 </ul>
    //               </>
    //             ) : (
    //               <>
    //                 {loaderData.organizationTypes.map((type) => {
    //                   return (
    //                     <div key={type.id}>
    //                       <label htmlFor={type.id}>{type.title}</label>
    //                       <input
    //                         type="checkbox"
    //                         id={type.id}
    //                         defaultChecked={types.includes(type.id)}
    //                       />
    //                     </div>
    //                   );
    //                 })}
    //               </>
    //             );
    //           }}
    //         </Field>
    //         <Error />
    //         <Button>Submit</Button>
    //       </>
    //     );
    //   }}
    // </Form>
  );
}

export default General;
