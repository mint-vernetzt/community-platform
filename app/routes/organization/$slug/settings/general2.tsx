import { Area, Organization, OrganizationType } from "@prisma/client";
import { Fetcher } from "@remix-run/react/transition";
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
  getAreas,
  getOrganizationBySlug,
  getOrganizationTypes,
} from "./general2/utils.server";

// TODO: implement
const validateListOfUuids = (_value: string) => {
  return true;
};

// TODO: implement
const validateListOfStrings = (_value: string) => {
  return true;
};

const testSchema = z.object({
  value: z.string().min(1, "Error!!!!!"),
});

const schema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(), // TODO: validate phone number
  street: z.string().optional(),
  streetNumber: z.string().optional(), // TODO: validate street number
  zipCode: z.string().optional(), // TODO: validate zipCode
  city: z.string().optional(),
  website: z.string().optional(), // TODO: validate social/website
  facebook: z.string().optional(), // TODO: validate social/website
  linkedin: z.string().optional(), // TODO: validate social/website
  twitter: z.string().optional(), // TODO: validate social/website
  xing: z.string().optional(), // TODO: validate social/website
  bio: z.string().optional(),
  quote: z.string().optional(),
  quoteAuthor: z.string().optional(),
  quoteAuthorInformation: z.string().optional(),
  supportedBy: z.string().refine(validateListOfStrings),
  publicFields: z.string().refine(validateListOfStrings),
  areas: z.string().refine(validateListOfUuids),
  types: z.string().refine(validateListOfUuids),
});

const mutation = makeDomainFunction(schema)(async (values) => {
  console.log("values", values);
  return values;
});

type LoaderData = {
  organization: Organization & {
    types: string[];
    areas: string[];
  };
  organizationTypes: OrganizationType[];
  areas: Area[];
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

  const areas = await getAreas();
  const areaIds = organization.areas.map((area) => {
    return area.areaId;
  });

  return {
    organization: {
      ...organization,
      types: organizationTypeIds,
      areas: areaIds,
    },
    organizationTypes,
    areas,
  };
};

export const action: ActionFunction = async (args) => {
  const { request } = args;
  const formData = await request.clone().formData();

  const result = await performMutation({ schema, mutation, request });
  return result;
};

type InputAddProps = {
  name: string;
  fetcher: ReturnType<typeof useFetcher>;
  values: string[];
};

function InputAdd(props: InputAddProps) {
  const { fetcher, name, values } = props;
  const [value, setValue] = React.useState("");

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setValue(event.target.value);
  };

  return (
    <>
      <input aria-label={name} value={value} onChange={handleChange} />
      <button
        value={name}
        onClick={() => {
          const allValues = values.concat([value]).join("&value=");
          fetcher.load(`/field?name=${name}&value=${allValues}`);
        }}
      >
        Add
      </button>
      <ul>
        {values.map((value) => {
          return <li key={value}>{value}</li>;
        })}
      </ul>
    </>
  );
}

function General() {
  const loaderData = useLoaderData<LoaderData>();

  // const [jsAvailable, setJsAvailable] = React.useState(false);

  // useEffect(() => {
  //   setJsAvailable(true);
  // }, []);

  const fetcher = useFetcher();

  let types = loaderData.organization.types;
  if (fetcher.data && fetcher.data.types) {
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

  let areas = loaderData.organization.areas;
  if (fetcher.data && fetcher.data.areas) {
    areas = fetcher.data.areas;
  }

  const selectedAreas = loaderData.areas.filter((type) => {
    return areas.includes(type.id);
  });

  const areaOptions = loaderData.areas.filter((type) => {
    return areas.includes(type.id) === false;
  });

  const divider = { label: "---------", options: [] };
  const countries = areaOptions.filter((area) => {
    return area.type === "country";
  });
  const countryOptions = countries.map((country) => {
    return {
      label: country.name,
      value: country.id,
    };
  });

  const states = areaOptions
    .filter((area) => {
      return area.type === "state";
    })
    .sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  const stateOptions = states.map((state) => {
    return {
      label: state.name,
      value: state.id,
    };
  });

  const districtOptions = states.map((state) => {
    const options = areaOptions
      .filter((area) => {
        return area.type === "district" && area.stateId === state.stateId;
      })
      .map((district) => {
        return {
          label: district.name,
          value: district.id,
        };
      })
      .sort((a, b) => {
        return a.label.localeCompare(b.label);
      });

    return {
      label: state.name,
      options,
    };
  });

  const groupedAreaOptions = [
    ...countryOptions,
    divider,
    {
      label: "Bundesland",
      options: stateOptions,
    },
    divider,
    ...districtOptions,
  ];

  let supportedBy = loaderData.organization.supportedBy;
  if (fetcher.data && fetcher.data.supportedBy) {
    supportedBy = fetcher.data.supportedBy;
  }

  return (
    <>
      <Form
        schema={schema}
        values={{ ...loaderData.organization, types, areas, supportedBy }}
      >
        {(props) => {
          const { Field, Button, Error } = props;
          return (
            <>
              <h1>Allgemein</h1>
              <Field name="name" />
              <Field name="email" />
              <Field name="phone" />
              <h1>Anschrift</h1>
              <Field name="street" />
              <Field name="streetNumber" />
              <Field name="zipCode" />
              <Field name="city" />
              <h2>Organisationsform</h2>
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
              <h1>Über uns</h1>
              <Field name="bio" />
              <h2>Aktivitätsgebiete</h2>
              <Field name="areas" hidden />
              <select
                onChange={(event) => {
                  const values = areas
                    .concat([event.target.value])
                    .join("&value=");
                  fetcher.load(`/field?name=areas&value=${values}`);
                  event.target.selectedIndex = 0; // TODO: Why here and not on "types" necessary
                }}
              >
                <option />
                {groupedAreaOptions.map((option, index) => {
                  return (
                    <React.Fragment key={index}>
                      {"value" in option && (
                        <option
                          key={`area-option-${index}`}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      )}

                      {"options" in option && (
                        <optgroup
                          key={`area-option-${index}`}
                          label={option.label}
                        >
                          {option.options.map(
                            (groupOption, groupOptionIndex) => (
                              <option
                                key={`area-option-${index}-${groupOptionIndex}`}
                                value={groupOption.value}
                              >
                                {groupOption.label}
                              </option>
                            )
                          )}
                        </optgroup>
                      )}
                    </React.Fragment>
                  );
                })}
              </select>
              <ul>
                {selectedAreas.map((type) => {
                  return <li key={type.id}>{type.name}</li>;
                })}
              </ul>
              <h2>Gefördert von</h2>
              <Field name="supportedBy" hidden />
              <InputAdd
                name="supportedBy"
                values={supportedBy}
                fetcher={fetcher}
              />
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
