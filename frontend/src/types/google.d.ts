interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      shape?: "rectangular" | "pill" | "circle" | "square";
      theme?: "outline" | "filled_blue" | "filled_black";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      size?: "large" | "medium" | "small";
      width?: number;
    },
  ) => void;
}

interface Window {
  google?: {
    accounts?: {
      id?: GoogleAccountsIdApi;
    };
  };
}
