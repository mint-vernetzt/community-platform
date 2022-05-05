import React from "react";

export interface IconProps {
  type: IconType;
  width?: string;
  height?: string;
  scaleFactor?: number;
  className?: string;
}

export enum IconType {
  Flag = "Flag",
  Gem = "Gem",
  LightBulb = "LightBulb",
  Magic = "Magic",
  Envelope = "Envelope",
  Telephone = "Telephone",
  Calendar = "Calendar",
  Twitter = "Twitter",
  Instagram = "Instagram",
  LinkedIn = "LinkedIn",
  Youtube = "Youtube",
  Quote = "Quote",
  FilePDF = "FilePDF",
  Download = "Download",
  ChevronLeft = "ChevronLeft",
  Location = "Location",
  Website = "Website",
}

type Path = {
  d?: string;
  transform?: string;
  paths?: React.ReactNode;
};

const Paths = {
  Flag: {
    d: "M12.778,0.085 C12.9165502,0.17767976 12.9998028,0.333309691 13,0.5 L13,8 C13,8.20429019 12.8756288,8.38800405 12.686,8.464 L12.5,8 L12.686,8.464 L12.683,8.465 L12.677,8.468 L12.654,8.477 C12.5225296,8.52925472 12.390177,8.579262 12.257,8.627 C11.993,8.722 11.626,8.85 11.21,8.977 C10.394,9.229 9.331,9.5 8.5,9.5 C7.653,9.5 6.952,9.22 6.342,8.975 L6.314,8.965 C5.68,8.71 5.14,8.5 4.5,8.5 C3.8,8.5 2.862,8.73 2.063,8.977 C1.70525488,9.08849386 1.35077623,9.21021043 1,9.342 L1,15.5 C1,15.7761424 0.776142375,16 0.5,16 C0.223857625,16 8.8817842e-16,15.7761424 8.8817842e-16,15.5 L8.8817842e-16,0.5 C8.8817842e-16,0.223857625 0.223857625,0 0.5,0 C0.776142375,0 1,0.223857625 1,0.5 L1,0.782 C1.226,0.703 1.496,0.612 1.79,0.522 C2.606,0.272 3.67,0 4.5,0 C5.34,0 6.024,0.277 6.621,0.519 L6.664,0.537 C7.286,0.788 7.828,1 8.5,1 C9.2,1 10.138,0.77 10.937,0.523 C11.3923126,0.380812212 11.8422793,0.222039685 12.286,0.047 L12.305,0.04 L12.309,0.038 L12.31,0.038 M12,1.221 C11.78,1.299 11.52,1.388 11.234,1.476 C10.424,1.728 9.362,1.999 8.5,1.999 C7.614,1.999 6.908,1.713 6.297,1.465 L6.289,1.462 C5.662,1.21 5.139,1 4.5,1 C3.831,1 2.894,1.229 2.085,1.478 C1.72010805,1.59058256 1.35831054,1.71296015 1,1.845 L1,8.278 C1.22,8.2 1.48,8.111 1.766,8.023 C2.576,7.77 3.638,7.5 4.5,7.5 C5.347,7.5 6.048,7.78 6.658,8.025 L6.686,8.035 C7.32,8.29 7.86,8.5 8.5,8.5 C9.168,8.5 10.106,8.271 10.915,8.022 C11.2798885,7.9094069 11.6416858,7.7870294 12,7.655 L12,1.222 L12,1.221 Z",
    transform: "translate(9 7)",
  } as Path,
  Gem: {
    d: "M3.1,0.2 C3.19442719,0.0740970787 3.34262135,0 3.5,0 L12.5,0 C12.6573787,0 12.8055728,0.0740970787 12.9,0.2 L15.876,4.174 C16.025,4.359 16.032,4.624 15.886,4.818 L8.4,14.8 C8.30557281,14.9259029 8.15737865,15 8,15 C7.84262135,15 7.69442719,14.9259029 7.6,14.8 L0.1,4.8 C-0.0333333333,4.62222222 -0.0333333333,4.37777778 0.1,4.2 L3.1,0.2 Z M14.486,3.985 L12.68,1.575 L11.904,3.988 L14.486,3.985 L14.486,3.985 Z M10.853,3.989 L11.814,1 L4.186,1 L5.149,3.995 L10.853,3.989 L10.853,3.989 Z M5.47,4.995 L8,12.866 L10.532,4.99 L5.47,4.995 Z M4.099,3.996 L3.319,1.574 L1.501,3.999 L4.099,3.996 Z M1.499,5 L6.612,11.817 L4.42,4.997 L1.5,5 L1.499,5 Z M9.388,11.817 L14.511,4.987 L11.583,4.989 L9.388,11.817 L9.388,11.817 Z",
    transform: "translate(7 8)",
  } as Path,
  LightBulb: {
    d: "M3.62164371e-06,6.00074089 C3.62164371e-06,3.2731446 1.83962054,0.88870705 4.47800104,0.196803965 C7.11638154,-0.495099121 9.88946285,0.679658144 11.2279321,3.05626954 C12.5664013,5.43288093 12.1334162,8.41324307 10.1740073,10.3107409 C9.97100726,10.5067409 9.81500726,10.7107409 9.72100726,10.9297409 L8.95900726,12.6987409 C8.87998262,12.8819844 8.69956444,13.0006909 8.50000362,13.0007409 C8.77614963,13.0007409 9.00000362,13.2245985 9.00000362,13.5007409 C9.00000362,13.7768833 8.77614963,14.0007409 8.50000362,14.0007409 C8.77614963,14.0007409 9.00000362,14.2245985 9.00000362,14.5007409 C9.00000362,14.7768833 8.77614963,15.0007409 8.50000362,15.0007409 L8.27600726,15.4477409 C8.10674372,15.7864703 7.76067297,16.0005387 7.38200726,16.0007409 L4.61800726,16.0007409 C4.23934155,16.0005387 3.8932708,15.7864703 3.72400726,15.4477409 L3.50000362,15.0007409 C3.22386488,15.0007409 3.00000362,14.7768833 3.00000362,14.5007409 C3.00000362,14.2245985 3.22386488,14.0007409 3.50000362,14.0007409 C3.22386488,14.0007409 3.00000362,13.7768833 3.00000362,13.5007409 C3.00000362,13.2245985 3.22386488,13.0007409 3.50000362,13.0007409 C3.30008695,13.0010905 3.11917552,12.8823182 3.04000726,12.6987409 L2.27900726,10.9287409 C2.17004652,10.6949972 2.01611749,10.4850013 1.82600726,10.3107409 C0.657380092,9.18160155 -0.00178279964,7.6257461 3.62164371e-06,6.00074089 Z M6.00000726,1.00074055 C3.96287991,1.00039505 2.12922379,2.23597072 1.36466558,4.12418116 C0.60010737,6.01239161 1.05753492,8.17565351 2.52100726,9.59274089 C2.78400726,9.84674089 3.03500726,10.1567409 3.19700726,10.5337409 L3.83000726,12.0007405 L8.17200726,12.0007405 L8.80400726,10.5337409 C8.96600726,10.1567409 9.21700726,9.84674089 9.48000726,9.59274089 C10.9436107,8.17552677 11.400977,6.01202051 10.6361616,4.1237175 C9.87134609,2.2354145 8.03731685,0.999987448 6.00000726,1.00074055 Z",
    transform: "translate(9 7)",
  } as Path,
  Magic: {
    d: "M8.90693382,2.30466379 C8.90693382,2.5779207 9.12846693,2.79943919 9.40174186,2.79943919 C9.67501679,2.79943919 9.8965499,2.5779207 9.8965499,2.30466379 L9.8965499,0.494775395 C9.8965499,0.22151849 9.67501679,0 9.40174186,0 C9.12846693,0 8.90693382,0.22151849 8.90693382,0.494775395 L8.90693382,2.30466379 L8.90693382,2.30466379 Z M13.3602062,2.33929807 C13.5477247,2.14515865 13.5450429,1.83656432 13.3541787,1.64571273 C13.1633145,1.45486114 12.8546998,1.45217954 12.6605476,1.63968566 L11.380974,2.91917483 C11.2523454,3.0434003 11.2007587,3.22735949 11.2460413,3.40034753 C11.2913238,3.57333557 11.4264287,3.7084315 11.5994281,3.75371108 C11.7724276,3.79899067 11.9563989,3.74740736 12.0806326,3.61878724 L13.3602062,2.33929807 L13.3602062,2.33929807 Z M6.72285114,3.61878724 C6.84708481,3.74740736 7.03105613,3.79899067 7.20405559,3.75371108 C7.37705504,3.7084315 7.51215988,3.57333557 7.55744245,3.40034753 C7.60272503,3.22735949 7.55113832,3.0434003 7.42250971,2.91917483 L6.14293612,1.63968566 C5.9487839,1.45217954 5.64016921,1.45486114 5.44930503,1.64571273 C5.25844084,1.83656432 5.25575906,2.14515865 5.44327756,2.33929807 L6.72285114,3.61878724 Z M6.10829956,6.09266422 C6.38157449,6.09266422 6.6031076,5.87114573 6.6031076,5.59788882 C6.6031076,5.32463192 6.38157449,5.10311343 6.10829956,5.10311343 L4.29829176,5.10311343 C4.02501683,5.10311343 3.80348372,5.32463192 3.80348372,5.59788882 C3.80348372,5.87114573 4.02501683,6.09266422 4.29829176,6.09266422 L6.10829956,6.09266422 L6.10829956,6.09266422 Z M14.505192,6.09266422 C14.7784669,6.09266422 15,5.87114573 15,5.59788882 C15,5.32463192 14.7784669,5.10311343 14.505192,5.10311343 L12.6951842,5.10311343 C12.4219092,5.10311343 12.2003761,5.32463192 12.2003761,5.59788882 C12.2003761,5.87114573 12.4219092,6.09266422 12.6951842,6.09266422 L14.505192,6.09266422 Z M12.6605476,9.55609198 C12.7847813,9.68471211 12.9687526,9.73629542 13.141752,9.69101583 C13.3147515,9.64573624 13.4498563,9.51064031 13.4951389,9.33765227 C13.5404215,9.16466423 13.4888348,8.98070505 13.3602062,8.85647957 L12.0806326,7.5769904 C11.9563989,7.44837028 11.7724276,7.39678697 11.5994281,7.44206656 C11.4264287,7.48734615 11.2913238,7.62244208 11.2460413,7.79543012 C11.2007587,7.96841816 11.2523454,8.15237734 11.380974,8.27660281 L12.6605476,9.55609198 Z M8.90693382,10.7010022 C8.90693382,10.9742592 9.12846693,11.1957776 9.40174186,11.1957776 C9.67501679,11.1957776 9.8965499,10.9742592 9.8965499,10.7010022 L9.8965499,8.89111385 C9.8965499,8.61785695 9.67501679,8.39633846 9.40174186,8.39633846 C9.12846693,8.39633846 8.90693382,8.61785695 8.90693382,8.89111385 L8.90693382,10.7010022 Z M10.741682,5.65726187 C10.9341875,5.464166 10.9341875,5.15173488 10.741682,4.95863901 L10.0410338,4.25803705 C9.84781138,4.06488567 9.53459775,4.06488567 9.34137528,4.25803705 L8.06180169,5.53851577 C7.86863757,5.73172549 7.86863757,6.04491846 8.06180169,6.23812818 L8.76244988,6.93873014 C8.95567234,7.13188152 9.26888598,7.13188152 9.46210844,6.93873014 L10.741682,5.65924097 L10.741682,5.65726187 Z M7.7728338,8.62591424 C7.96533931,8.43281837 7.96533931,8.12038725 7.7728338,7.92729138 L7.07218562,7.22668942 C6.87896315,7.03353805 6.56574952,7.03353805 6.37252705,7.22668942 L0.144873091,13.4549221 C-0.0482910302,13.6481318 -0.0482910302,13.9613248 0.144873091,14.1545345 L0.845521272,14.8551365 C1.03874374,15.0482878 1.35195737,15.0482878 1.54517984,14.8551365 L7.7728338,8.62591424 L7.7728338,8.62591424 Z",
    transform: "translate(8 7)",
  } as Path,
  Envelope: {
    d: "M0,2 C0,0.8954305 0.8954305,0 2,0 L14,0 C15.1045695,0 16,0.8954305 16,2 L16,10 C16,11.1045695 15.1045695,12 14,12 L2,12 C0.8954305,12 0,11.1045695 0,10 L0,2 Z M2,1 C1.44771525,1 1,1.44771525 1,2 L1,2.217 L8,6.417 L15,2.217 L15,2 C15,1.44771525 14.5522847,1 14,1 L2,1 Z M15,3.383 L10.292,6.208 L15,9.105 L15,3.383 Z M14.966,10.259 L9.326,6.788 L8,7.583 L6.674,6.788 L1.034,10.258 C1.15083968,10.6955352 1.547133,10.9999344 2,11 L14,11 C14.4525816,11.0000555 14.8487814,10.6961383 14.966,10.259 L14.966,10.259 Z M1,9.105 L5.708,6.208 L1,3.383 L1,9.105 Z",
    transform: "translate(0 2)",
  } as Path,
  Telephone: {
    d: "M3.65447093,1.32829902 C3.53505183,1.17468212 3.35538991,1.07977501 3.16118956,1.06772119 C2.9669892,1.05566738 2.77696993,1.12762876 2.63947093,1.26529902 L1.60547093,2.30029902 C1.12247093,2.78429902 0.944470934,3.46929902 1.15547093,4.07029902 C2.03121051,6.55788658 3.45576569,8.81639442 5.32347093,10.678299 C7.18539707,12.5459774 9.44389838,13.9705284 11.9314709,14.846299 C12.5324709,15.057299 13.2174709,14.879299 13.7014709,14.396299 L14.7354709,13.362299 C14.8731412,13.2248 14.9451026,13.0347808 14.9330488,12.8405804 C14.9209949,12.64638 14.8260878,12.4667181 14.6724709,12.347299 L12.3654709,10.553299 C12.2010915,10.4258072 11.9872827,10.3808336 11.7854709,10.431299 L9.59547093,10.978299 C9.00085746,11.126914 8.37186777,10.9526797 7.93847093,10.519299 L5.48247093,8.06229902 C5.04873192,7.62910592 4.87411041,7.00008885 5.02247093,6.40529902 L5.57047093,4.21529902 C5.62093633,4.01348725 5.57596275,3.79967842 5.44847093,3.63529902 L3.65447093,1.32829902 Z M1.88447093,0.511299023 C2.23846695,0.15719045 2.727519,-0.0277934276 3.22725245,0.00339208258 C3.72698591,0.0345775928 4.1892457,0.278927409 4.49647093,0.674299023 L6.29047093,2.98029902 C6.61947093,3.40329902 6.73547093,3.95429902 6.60547093,4.47429902 L6.05847093,6.66429902 C6.00094625,6.89501666 6.06848963,7.13900762 6.23647093,7.30729902 L8.69347093,9.76429902 C8.86197145,9.9326295 9.10644056,10.0002002 9.33747093,9.94229902 L11.5264709,9.39529902 C12.0464199,9.26529569 12.5972703,9.38143883 13.0204709,9.71029902 L15.3264709,11.504299 C16.1554709,12.149299 16.2314709,13.374299 15.4894709,14.115299 L14.4554709,15.149299 C13.7154709,15.889299 12.6094709,16.214299 11.5784709,15.851299 C8.93965411,14.9228249 6.5437434,13.4121365 4.56847093,11.431299 C2.58775967,9.45631473 1.07707914,7.06075821 0.148470934,4.42229902 C-0.213529066,3.39229902 0.111470934,2.28529902 0.851470934,1.54529902 L1.88547093,0.511299023 L1.88447093,0.511299023 Z",
    // transform: "translate(8 8)",
  } as Path,
  Calendar: {
    paths: (
      <>
        <path d="M14,0 L2,0 C0.8954305,0 0,0.8954305 0,2 L0,14 C0,15.1045695 0.8954305,16 2,16 L14,16 C15.1045695,16 16,15.1045695 16,14 L16,2 C16,0.8954305 15.1045695,0 14,0 Z M1,3.857 C1,3.384 1.448,3 2,3 L14,3 C14.552,3 15,3.384 15,3.857 L15,14.143 C15,14.616 14.552,15 14,15 L2,15 C1.448,15 1,14.616 1,14.143 L1,3.857 Z" />
        <path d="M6.5,7 C7.05228475,7 7.5,6.55228475 7.5,6 C7.5,5.44771525 7.05228475,5 6.5,5 C5.94771525,5 5.5,5.44771525 5.5,6 C5.5,6.55228475 5.94771525,7 6.5,7 Z M9.5,7 C10.0522847,7 10.5,6.55228475 10.5,6 C10.5,5.44771525 10.0522847,5 9.5,5 C8.94771525,5 8.5,5.44771525 8.5,6 C8.5,6.55228475 8.94771525,7 9.5,7 Z M12.5,7 C13.0522847,7 13.5,6.55228475 13.5,6 C13.5,5.44771525 13.0522847,5 12.5,5 C11.9477153,5 11.5,5.44771525 11.5,6 C11.5,6.55228475 11.9477153,7 12.5,7 Z M3.5,10 C4.05228475,10 4.5,9.55228475 4.5,9 C4.5,8.44771525 4.05228475,8 3.5,8 C2.94771525,8 2.5,8.44771525 2.5,9 C2.5,9.55228475 2.94771525,10 3.5,10 Z M6.5,10 C7.05228475,10 7.5,9.55228475 7.5,9 C7.5,8.44771525 7.05228475,8 6.5,8 C5.94771525,8 5.5,8.44771525 5.5,9 C5.5,9.55228475 5.94771525,10 6.5,10 Z M9.5,10 C10.0522847,10 10.5,9.55228475 10.5,9 C10.5,8.44771525 10.0522847,8 9.5,8 C8.94771525,8 8.5,8.44771525 8.5,9 C8.5,9.55228475 8.94771525,10 9.5,10 Z M12.5,10 C13.0522847,10 13.5,9.55228475 13.5,9 C13.5,8.44771525 13.0522847,8 12.5,8 C11.9477153,8 11.5,8.44771525 11.5,9 C11.5,9.55228475 11.9477153,10 12.5,10 Z M3.5,13 C4.05228475,13 4.5,12.5522847 4.5,12 C4.5,11.4477153 4.05228475,11 3.5,11 C2.94771525,11 2.5,11.4477153 2.5,12 C2.5,12.5522847 2.94771525,13 3.5,13 Z M6.5,13 C7.05228475,13 7.5,12.5522847 7.5,12 C7.5,11.4477153 7.05228475,11 6.5,11 C5.94771525,11 5.5,11.4477153 5.5,12 C5.5,12.5522847 5.94771525,13 6.5,13 Z M9.5,13 C10.0522847,13 10.5,12.5522847 10.5,12 C10.5,11.4477153 10.0522847,11 9.5,11 C8.94771525,11 8.5,11.4477153 8.5,12 C8.5,12.5522847 8.94771525,13 9.5,13 Z" />
      </>
    ),
    // d: "M6.5,7 C7.05228475,7 7.5,6.55228475 7.5,6 C7.5,5.44771525 7.05228475,5 6.5,5 C5.94771525,5 5.5,5.44771525 5.5,6 C5.5,6.55228475 5.94771525,7 6.5,7 Z M9.5,7 C10.0522847,7 10.5,6.55228475 10.5,6 C10.5,5.44771525 10.0522847,5 9.5,5 C8.94771525,5 8.5,5.44771525 8.5,6 C8.5,6.55228475 8.94771525,7 9.5,7 Z M12.5,7 C13.0522847,7 13.5,6.55228475 13.5,6 C13.5,5.44771525 13.0522847,5 12.5,5 C11.9477153,5 11.5,5.44771525 11.5,6 C11.5,6.55228475 11.9477153,7 12.5,7 Z M3.5,10 C4.05228475,10 4.5,9.55228475 4.5,9 C4.5,8.44771525 4.05228475,8 3.5,8 C2.94771525,8 2.5,8.44771525 2.5,9 C2.5,9.55228475 2.94771525,10 3.5,10 Z M6.5,10 C7.05228475,10 7.5,9.55228475 7.5,9 C7.5,8.44771525 7.05228475,8 6.5,8 C5.94771525,8 5.5,8.44771525 5.5,9 C5.5,9.55228475 5.94771525,10 6.5,10 Z M9.5,10 C10.0522847,10 10.5,9.55228475 10.5,9 C10.5,8.44771525 10.0522847,8 9.5,8 C8.94771525,8 8.5,8.44771525 8.5,9 C8.5,9.55228475 8.94771525,10 9.5,10 Z M12.5,10 C13.0522847,10 13.5,9.55228475 13.5,9 C13.5,8.44771525 13.0522847,8 12.5,8 C11.9477153,8 11.5,8.44771525 11.5,9 C11.5,9.55228475 11.9477153,10 12.5,10 Z M3.5,13 C4.05228475,13 4.5,12.5522847 4.5,12 C4.5,11.4477153 4.05228475,11 3.5,11 C2.94771525,11 2.5,11.4477153 2.5,12 C2.5,12.5522847 2.94771525,13 3.5,13 Z M6.5,13 C7.05228475,13 7.5,12.5522847 7.5,12 C7.5,11.4477153 7.05228475,11 6.5,11 C5.94771525,11 5.5,11.4477153 5.5,12 C5.5,12.5522847 5.94771525,13 6.5,13 Z M9.5,13 C10.0522847,13 10.5,12.5522847 10.5,12 C10.5,11.4477153 10.0522847,11 9.5,11 C8.94771525,11 8.5,11.4477153 8.5,12 C8.5,12.5522847 8.94771525,13 9.5,13 Z",
    // transform: "translate(8 8)",
  } as Path,
  Twitter: {
    d: "M5.026,13.000802 C11.064,13.000802 14.367,7.99780157 14.367,3.66680157 C14.367,3.52680157 14.367,3.38480157 14.361,3.24480157 C15.004059,2.77928742 15.55906,2.20295319 16,1.54280157 C15.3993143,1.80765219 14.7627608,1.98220737 14.111,2.06080157 C14.7975334,1.65043937 15.3117235,1.00477007 15.558,0.243801568 C14.9129877,0.625925571 14.2070145,0.894175075 13.471,1.03680157 C12.4536707,-0.0466441716 10.835776,-0.312378323 9.5253378,0.388738887 C8.21489962,1.0898561 7.53818867,2.58326169 7.875,4.03080157 C5.23531812,3.89844121 2.77579545,2.65214252 1.108,0.601801568 C0.239138953,2.10244363 0.684583798,4.01986928 2.126,4.98380157 C1.60553985,4.96611882 1.09652086,4.82636125 0.64,4.57580157 L0.64,4.62080157 C0.641850135,6.18238251 1.74181319,7.52724615 3.272,7.83880157 C2.99026288,7.91641544 2.69922938,7.95510775 2.407,7.95380157 C2.20098389,7.95442623 1.99538052,7.93533928 1.793,7.89680157 C2.22310516,9.23365057 3.45588634,10.1488911 4.86,10.1738016 C3.69655507,11.0876012 2.25940126,11.5832079 0.78,11.5808016 C0.519320759,11.5819023 0.258823122,11.5668736 4.38538095e-16,11.5358016 C1.50151474,12.4930657 3.24529765,13.001351 5.026,13.000802 Z",
    transform: "translate(7.5, 9.5)",
  } as Path,
  Instagram: {
    d: "M4.703,0.048 C3.85,0.088 3.269,0.222 2.76,0.42 C2.22609397,0.620819101 1.74249151,0.935826205 1.343,1.343 C0.936076146,1.74269612 0.621107275,2.22623987 0.42,2.76 C0.222,3.268 0.087,3.85 0.048,4.7 C0.01,5.555 0,5.827 0,8.001 C0,10.173 0.01,10.445 0.048,11.298 C0.088,12.15 0.222,12.731 0.42,13.24 C0.625,13.766 0.898,14.212 1.343,14.657 C1.787,15.102 2.233,15.376 2.759,15.58 C3.269,15.778 3.849,15.913 4.701,15.952 C5.555,15.99 5.827,16 8,16 C10.173,16 10.444,15.99 11.298,15.952 C12.149,15.912 12.732,15.778 13.241,15.58 C13.7745629,15.3790809 14.2578185,15.0640774 14.657,14.657 C15.102,14.212 15.375,13.766 15.58,13.24 C15.777,12.731 15.912,12.15 15.952,11.298 C15.99,10.445 16,10.173 16,8 C16,5.827 15.99,5.555 15.952,4.701 C15.912,3.85 15.777,3.268 15.58,2.76 C15.3789215,2.22622532 15.0639488,1.74267571 14.657,1.343 C14.2576318,0.935675629 13.7739939,0.620645439 13.24,0.42 C12.73,0.222 12.148,0.087 11.297,0.048 C10.443,0.01 10.172,0 7.998,0 C5.829,0 5.556,0.01 4.703,0.048 Z M7.283,1.442 L8.001,1.442 C10.137,1.442 10.39,1.449 11.233,1.488 C12.013,1.523 12.437,1.654 12.719,1.763 C13.092,1.908 13.359,2.082 13.639,2.362 C13.919,2.642 14.092,2.908 14.237,3.282 C14.347,3.563 14.477,3.987 14.512,4.767 C14.551,5.61 14.559,5.863 14.559,7.998 C14.559,10.133 14.551,10.387 14.512,11.23 C14.477,12.01 14.346,12.433 14.237,12.715 C14.1087418,13.0623594 13.904027,13.3764377 13.638,13.634 C13.358,13.914 13.092,14.087 12.718,14.232 C12.438,14.342 12.014,14.472 11.233,14.508 C10.39,14.546 10.137,14.555 8.001,14.555 C5.865,14.555 5.611,14.546 4.768,14.508 C3.988,14.472 3.565,14.342 3.283,14.232 C2.93549907,14.1039211 2.62112607,13.8995787 2.363,13.634 C2.09675081,13.3760335 1.89172301,13.0616575 1.763,12.714 C1.654,12.433 1.523,12.009 1.488,11.229 C1.45,10.386 1.442,10.133 1.442,7.996 C1.442,5.86 1.45,5.608 1.488,4.765 C1.524,3.985 1.654,3.561 1.764,3.279 C1.909,2.906 2.083,2.639 2.363,2.359 C2.643,2.079 2.909,1.906 3.283,1.761 C3.565,1.651 3.988,1.521 4.768,1.485 C5.506,1.451 5.792,1.441 7.283,1.44 L7.283,1.442 L7.283,1.442 Z M12.271,2.77 C11.928025,2.77 11.6111031,2.95297495 11.4396156,3.24999999 C11.2681281,3.54702503 11.2681281,3.91297497 11.4396156,4.21000001 C11.6111031,4.50702505 11.928025,4.69 12.271,4.69 C12.8011934,4.69 13.231,4.26019335 13.231,3.73 C13.231,3.19980665 12.8011934,2.77 12.271,2.77 L12.271,2.77 Z M8.001,3.892 C6.51789785,3.8688611 5.137445,4.64683671 4.38913384,5.92752317 C3.64082268,7.20820963 3.64082268,8.79279037 4.38913384,10.0734768 C5.137445,11.3541633 6.51789785,12.1321389 8.001,12.109 C10.2450717,12.0739887 12.0459005,10.2448448 12.0459005,8.0005 C12.0459005,5.75615515 10.2450717,3.92701131 8.001,3.892 Z M8.001,5.333 C9.47394343,5.333 10.668,6.52705657 10.668,8 C10.668,9.47294343 9.47394343,10.667 8.001,10.667 C6.52805657,10.667 5.334,9.47294343 5.334,8 C5.334,6.52705657 6.52805657,5.333 8.001,5.333 Z",
    transform: "translate(7.5, 7.5)",
  } as Path,
  LinkedIn: {
    d: "M0,1.146 C0,0.513 0.526,0 1.175,0 L14.825,0 C15.474,0 16,0.513 16,1.146 L16,14.854 C16,15.487 15.474,16 14.825,16 L1.175,16 C0.526,16 0,15.487 0,14.854 L0,1.146 Z M4.943,13.394 L4.943,6.169 L2.542,6.169 L2.542,13.394 L4.943,13.394 Z M3.743,5.182 C4.58,5.182 5.101,4.628 5.101,3.934 C5.086,3.225 4.581,2.686 3.759,2.686 C2.937,2.686 2.4,3.226 2.4,3.934 C2.4,4.628 2.921,5.182 3.727,5.182 L3.743,5.182 Z M8.651,13.394 L8.651,9.359 C8.651,9.143 8.667,8.927 8.731,8.773 C8.904,8.342 9.299,7.895 9.963,7.895 C10.832,7.895 11.179,8.557 11.179,9.529 L11.179,13.394 L13.58,13.394 L13.58,9.25 C13.58,7.03 12.396,5.998 10.816,5.998 C9.542,5.998 8.971,6.698 8.651,7.191 L8.651,7.216 L8.635,7.216 C8.640311,7.20765239 8.64564435,7.19931903 8.651,7.191 L8.651,6.169 L6.251,6.169 C6.281,6.847 6.251,13.394 6.251,13.394 L8.651,13.394 L8.651,13.394 Z",
    transform: "translate(7.5, 7.5)",
  } as Path,
  Youtube: {
    d: "M8.051,0 L8.14,0 C8.962,0.003 13.127,0.033 14.25,0.335 C14.9408898,0.522568769 15.4798694,1.0634529 15.665,1.755 C15.766,2.135 15.837,2.638 15.885,3.157 L15.895,3.261 L15.917,3.521 L15.925,3.625 C15.99,4.539 15.998,5.395 15.999,5.582 L15.999,5.657 C15.998,5.851 15.989,6.765 15.917,7.717 L15.909,7.822 L15.9,7.926 C15.85,8.498 15.776,9.066 15.665,9.484 C15.4804219,10.1758652 14.9412098,10.7169826 14.25,10.904 C13.09,11.216 8.681,11.238 8.07,11.239 L7.928,11.239 C7.619,11.239 6.341,11.233 5.001,11.187 L4.831,11.181 L4.744,11.177 L4.573,11.17 L4.402,11.163 C3.292,11.114 2.235,11.035 1.748,10.903 C1.05704427,10.7161615 0.517887287,10.1754804 0.333,9.484 C0.222,9.067 0.148,8.498 0.098,7.926 L0.09,7.821 L0.082,7.717 C0.0326475953,7.03939916 0.00529986626,6.36037506 0,5.681 L0,5.558 C0.002,5.343 0.01,4.6 0.064,3.78 L0.071,3.677 L0.074,3.625 L0.082,3.521 L0.104,3.261 L0.114,3.157 C0.162,2.638 0.233,2.134 0.334,1.755 C0.518578141,1.06313482 1.05779019,0.522017427 1.749,0.335 C2.236,0.205 3.293,0.125 4.403,0.075 L4.573,0.068 L4.745,0.062 L4.831,0.059 L5.002,0.052 C5.95370791,0.0213745592 6.90580543,0.00437281779 7.858,0.001 L8.051,0.001 L8.051,0 Z M6.4,3.21 L6.4,8.028 L10.557,5.62 L6.4,3.21 Z",
    transform: "translate(7.5, 9.5)",
  } as Path,
  Quote: {
    d: "M9.00017328,9 C9.55245803,9 10.0001733,8.55228475 10.0001733,8 L10.0001733,5.558 C10.0001733,5.00571525 9.55245803,4.558 9.00017328,4.558 L7.61217328,4.558 C7.61217328,4.207 7.63317328,3.855 7.67417328,3.504 C7.73617328,3.132 7.84017328,2.801 7.98417328,2.512 C8.12917328,2.222 8.31517328,1.995 8.54317328,1.829 C8.77017328,1.643 9.05917328,1.55 9.41117328,1.55 L9.41117328,0 C8.83217328,0 8.32617328,0.124 7.89117328,0.372 C7.4599598,0.617485904 7.08921567,0.956451968 6.80617328,1.364 C6.52209844,1.81331452 6.3127176,2.3056972 6.18617328,2.822 C6.05865921,3.39176025 5.99625943,3.97415819 6.00017328,4.558 L6.00017328,8 C6.00017328,8.55228475 6.44788853,9 7.00017328,9 L9.00017328,9 L9.00017328,9 Z M3.00017328,9 C3.55245803,9 4.00017328,8.55228475 4.00017328,8 L4.00017328,5.558 C4.00017328,5.00571525 3.55245803,4.558 3.00017328,4.558 L1.61217328,4.558 C1.61217328,4.207 1.63317328,3.855 1.67417328,3.504 C1.73617328,3.132 1.84017328,2.801 1.98417328,2.512 C2.12917328,2.222 2.31517328,1.995 2.54317328,1.829 C2.77017328,1.643 3.05917328,1.55 3.41117328,1.55 L3.41117328,0 C2.83217328,0 2.32617328,0.124 1.89117328,0.372 C1.4599598,0.617485904 1.08921567,0.956451968 0.806173278,1.364 C0.522098438,1.81331452 0.312717599,2.3056972 0.186173278,2.822 C0.0586592053,3.39176025 -0.00374057375,3.97415819 0.000173278462,4.558 L0.000173278462,8 C0.000173278462,8.55228475 0.447888529,9 1.00017328,9 L3.00017328,9 Z",
    transform: "translate(11 12)",
  } as Path,
  FilePDF: {
    paths: (
      <g transform="translate(9 8)">
        <path d="M15,17.5 L15,5.625 L9.375,0 L2.5,0 C1.11928813,0 0,1.11928813 0,2.5 L0,17.5 C0,18.8807119 1.11928813,20 2.5,20 L12.5,20 C13.8807119,20 15,18.8807119 15,17.5 Z M9.375,3.75 C9.375,4.78553391 10.2144661,5.625 11.25,5.625 L13.75,5.625 L13.75,17.5 C13.75,18.1903559 13.1903559,18.75 12.5,18.75 L2.5,18.75 C1.80964406,18.75 1.25,18.1903559 1.25,17.5 L1.25,2.5 C1.25,1.80964406 1.80964406,1.25 2.5,1.25 L9.375,1.25 L9.375,3.75 Z" />
        <path d="M3.25375,17.60875 C3.01011546,17.5113062 2.81382596,17.3230834 2.70625,17.08375 C2.4625,16.59875 2.54375,16.11375 2.80625,15.70625 C3.05375,15.3225 3.46375,14.99625 3.9275,14.7225 C4.51492285,14.38934 5.13586057,14.1190938 5.78,13.91625 C6.28023807,13.0169862 6.72360764,12.0872461 7.1075,11.1325 C6.87797283,10.6109639 6.69801348,10.0689933 6.57,9.51375 C6.4625,9.01375 6.42125,8.51875 6.5125,8.09375 C6.60625,7.65125 6.855,7.25375 7.325,7.065 C7.565,6.96875 7.825,6.915 8.0775,6.96875 C8.33471359,7.02350598 8.55366027,7.19104379 8.67375,7.425 C8.78375,7.63 8.82375,7.87 8.8325,8.0975 C8.84125,8.3325 8.8175,8.5925 8.77375,8.865 C8.66875,9.5025 8.43625,10.2825 8.12375,11.1075 C8.46861428,11.8450227 8.87857178,12.5503169 9.34875,13.215 C9.90512543,13.171056 10.4647252,13.1920305 11.01625,13.2775 C11.47125,13.36 11.93375,13.52125 12.21625,13.85875 C12.36625,14.03875 12.4575,14.25875 12.46625,14.50625 C12.475,14.74625 12.4075,14.98375 12.29375,15.21 C12.1952174,15.4196644 12.0424479,15.5991902 11.85125,15.73 C11.662255,15.8532818 11.4391231,15.9136587 11.21375,15.9025 C10.8,15.885 10.39625,15.6575 10.0475,15.38125 C9.62342654,15.0306188 9.24130696,14.6321407 8.90875,14.19375 C8.06344107,14.2896833 7.22816354,14.4594993 6.4125,14.70125 C6.03897261,15.3636941 5.61258834,15.99491 5.1375,16.58875 C4.7725,17.02625 4.37625,17.40875 3.97875,17.5725 C3.75036023,17.6758197 3.49130687,17.6887723 3.25375,17.60875 L3.25375,17.60875 Z M4.9775,15.2325 C4.77,15.3275 4.5775,15.4275 4.40375,15.53 C3.99375,15.7725 3.7275,16.00875 3.595,16.21375 C3.4775,16.395 3.475,16.52625 3.545,16.665 C3.5575,16.6925 3.57,16.71 3.5775,16.72 C3.59241382,16.7160215 3.60703251,16.7110094 3.62125,16.705 C3.7925,16.635 4.065,16.41125 4.415,15.99 C4.61405602,15.7462899 4.8017558,15.4935209 4.9775,15.2325 L4.9775,15.2325 Z M7.0275,13.57 C7.44490674,13.472586 7.86608466,13.3921035 8.29,13.32875 C8.06239708,12.9804459 7.84970503,12.6226228 7.6525,12.25625 C7.45643994,12.6994895 7.24802518,13.1371605 7.0275,13.56875 L7.0275,13.57 Z M10.085,14.1325 C10.2725,14.33625 10.455,14.5075 10.62875,14.645 C10.92875,14.8825 11.1375,14.96125 11.25125,14.965 C11.2817044,14.9689819 11.3126013,14.9623611 11.33875,14.94625 C11.3907492,14.9051841 11.4312295,14.8513539 11.45625,14.79 C11.5006923,14.7138584 11.5259993,14.6280718 11.53,14.54 C11.5292797,14.5106338 11.5177006,14.4825767 11.4975,14.46125 C11.4325,14.38375 11.2475,14.27125 10.85,14.2 C10.5971543,14.1577127 10.3413511,14.1355598 10.085,14.13375 L10.085,14.1325 Z M7.5975,9.75 C7.70270216,9.41065194 7.78620421,9.06495347 7.8475,8.715 C7.88625,8.48 7.90125,8.28625 7.895,8.13375 C7.89534533,8.04961344 7.88183114,7.96599441 7.855,7.88625 C7.79246892,7.89399173 7.73140615,7.91083664 7.67375,7.93625 C7.565,7.98 7.47625,8.06875 7.42875,8.29 C7.37875,8.53 7.39125,8.87625 7.48625,9.3175 C7.51625,9.45625 7.55375,9.60125 7.59875,9.75 L7.5975,9.75 Z" />
      </g>
    ),
  } as Path,
  Download: {
    paths: (
      <g transform="translate(10 10)">
        <path d="M1.5,10 C1.22385763,10 1,9.77614237 1,9.5 L1,1.5 C1,1.22385763 1.22385763,1 1.5,1 L10.5,1 C10.7761424,1 11,1.22385763 11,1.5 L11,9.5 C11,9.77614237 10.7761424,10 10.5,10 L8.5,10 C8.22385763,10 8,10.2238576 8,10.5 C8,10.7761424 8.22385763,11 8.5,11 L10.5,11 C11.3284271,11 12,10.3284271 12,9.5 L12,1.5 C12,0.671572875 11.3284271,0 10.5,0 L1.5,0 C0.671572875,0 0,0.671572875 0,1.5 L0,9.5 C0,10.3284271 0.671572875,11 1.5,11 L3.5,11 C3.77614237,11 4,10.7761424 4,10.5 C4,10.2238576 3.77614237,10 3.5,10 L1.5,10 Z" />
        <path d="M5.646,15.854 C5.73980426,15.9480417 5.86717274,16.0008938 6,16.0008938 C6.13282726,16.0008938 6.26019574,15.9480417 6.354,15.854 L9.354,12.854 C9.5495088,12.6584912 9.5495088,12.3415088 9.354,12.146 C9.1584912,11.9504912 8.8415088,11.9504912 8.646,12.146 L6.5,14.293 L6.5,5.5 C6.5,5.22385763 6.27614237,5 6,5 C5.72385763,5 5.5,5.22385763 5.5,5.5 L5.5,14.293 L3.354,12.146 C3.1584912,11.9504912 2.8415088,11.9504912 2.646,12.146 C2.4504912,12.3415088 2.4504912,12.6584912 2.646,12.854 L5.646,15.854 Z" />
      </g>
    ),
  } as Path,
  ChevronLeft: {
    d: "M11.3548938,1.64689378 C11.4489355,1.74069805 11.5017876,1.86806652 11.5017876,2.00089378 C11.5017876,2.13372104 11.4489355,2.26108952 11.3548938,2.35489378 L5.70789378,8.00089378 L11.3548938,13.6468938 C11.5504026,13.8424026 11.5504026,14.159385 11.3548938,14.3548938 C11.159385,14.5504026 10.8424026,14.5504026 10.6468938,14.3548938 L4.64689378,8.35489378 C4.55285208,8.26108952 4.5,8.13372104 4.5,8.00089378 C4.5,7.86806652 4.55285208,7.74069805 4.64689378,7.64689378 L10.6468938,1.64689378 C10.7406981,1.55285208 10.8680665,1.5 11.0008938,1.5 C11.133721,1.5 11.2610895,1.55285208 11.3548938,1.64689378 Z",
  } as Path,
  Location: {
    d: "M6 1.6a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2ZM1.2 5.2a4.8 4.8 0 1 1 5.4 4.762V16.6a.6.6 0 1 1-1.2 0V9.964a4.8 4.8 0 0 1-4.2-4.766V5.2Zm2.992 10.289a.6.6 0 0 1-.494.69c-.854.141-1.536.354-1.986.591-.165.08-.315.187-.444.318a.363.363 0 0 0-.068.108v.004l.002.01a.174.174 0 0 0 .02.039.74.74 0 0 0 .174.18c.198.156.522.324.975.474.901.3 2.184.497 3.63.497 1.444 0 2.727-.196 3.628-.497.454-.151.778-.318.976-.474a.744.744 0 0 0 .175-.18.18.18 0 0 0 .018-.04l.002-.01v-.004a.362.362 0 0 0-.068-.108 1.58 1.58 0 0 0-.444-.317c-.451-.237-1.132-.45-1.986-.591a.6.6 0 1 1 .197-1.184c.924.153 1.742.394 2.348.713C11.4 16 12 16.48 12 17.2c0 .511-.312.902-.652 1.172-.349.274-.817.496-1.34.67-1.053.351-2.47.558-4.008.558-1.537 0-2.954-.207-4.008-.558-.523-.174-.991-.396-1.34-.67-.34-.27-.652-.66-.652-1.172 0-.719.6-1.2 1.153-1.492.606-.319 1.425-.56 2.349-.713a.6.6 0 0 1 .69.494Z",
  } as Path,
  Website: {
    d: "M.4 10a9.6 9.6 0 1 1 19.2 0A9.6 9.6 0 0 1 .4 10Zm9-8.308c-.804.245-1.602.984-2.264 2.226a9.164 9.164 0 0 0-.474 1.047 15.23 15.23 0 0 0 2.738.344V1.692ZM5.499 4.647c.17-.461.365-.893.577-1.294a8.04 8.04 0 0 1 .716-1.12 8.412 8.412 0 0 0-2.73 1.827c.433.22.915.419 1.437.588v-.001ZM4.61 9.4c.043-1.284.225-2.504.523-3.61a10.949 10.949 0 0 1-1.878-.8A8.357 8.357 0 0 0 1.622 9.4H4.61Zm1.68-3.29a14.813 14.813 0 0 0-.48 3.29H9.4V6.51a16.21 16.21 0 0 1-3.11-.4Zm4.309.398V9.4h3.588a14.813 14.813 0 0 0-.479-3.29c-.97.225-2.017.362-3.11.4v-.002ZM5.812 10.6c.042 1.184.211 2.297.479 3.29a16.338 16.338 0 0 1 3.109-.398V10.6H5.812Zm4.788 0v2.89a16.21 16.21 0 0 1 3.11.4c.267-.993.436-2.106.48-3.29H10.6Zm-3.938 4.435c.144.375.302.725.474 1.047.662 1.242 1.461 1.98 2.264 2.226v-3.616a15.23 15.23 0 0 0-2.739.344Zm.131 2.731a8.034 8.034 0 0 1-.717-1.12c-.221-.417-.414-.85-.577-1.294-.494.159-.975.355-1.438.588a8.411 8.411 0 0 0 2.731 1.826h.002Zm-1.66-3.556a16.031 16.031 0 0 1-.524-3.61H1.622a8.356 8.356 0 0 0 1.634 4.41 10.9 10.9 0 0 1 1.878-.8Zm8.074 3.556a8.41 8.41 0 0 0 2.73-1.825c-.462-.232-.943-.43-1.436-.588-.163.444-.356.876-.577 1.294a8.022 8.022 0 0 1-.716 1.12ZM10.6 14.691v3.617c.804-.245 1.602-.984 2.264-2.226.172-.322.331-.672.474-1.047-.9-.197-1.817-.312-2.738-.343v-.001Zm4.266-.481a10.9 10.9 0 0 1 1.878.8 8.355 8.355 0 0 0 1.634-4.41H15.39a16.027 16.027 0 0 1-.524 3.61Zm3.512-4.81a8.356 8.356 0 0 0-1.634-4.41 10.9 10.9 0 0 1-1.878.8 16.08 16.08 0 0 1 .524 3.61h2.988Zm-4.454-6.047c.212.401.407.833.578 1.294.493-.159.973-.355 1.435-.588a8.412 8.412 0 0 0-2.73-1.824c.262.34.502.716.717 1.118Zm-.586 1.612a9.308 9.308 0 0 0-.474-1.047c-.662-1.242-1.46-1.98-2.264-2.226v3.616a15.23 15.23 0 0 0 2.738-.344Z",
  } as Path,
};

export function Icon(props: IconProps) {
  const {
    type,
    className,
    width = "16",
    height = "16",
    scaleFactor = 1,
  } = props;
  return (
    <svg
      style={{}}
      viewBox={`0 0 ${parseInt(width) * scaleFactor} ${
        parseInt(height) * scaleFactor
      }`}
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      {Paths[type].paths !== undefined ? (
        Paths[type].paths
      ) : (
        <path fill="#000000" {...Paths[type]} />
      )}
    </svg>
  );
}

export default Icon;
