export type IHostFilterRequest = {
    searchTerm?: string | undefined;
    email?: string | undefined;
    contactNumber?: string | undefined;
    gender?: string | undefined;
    specialties?: string | undefined;
};

export type IHostUpdate = {
  name?: string;
  profilePhoto?: string | null;
  contactNumber?: string;
  address?: string;

  // Host profile details
  bio?: string;
  experience?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";

  // Host verification / application related
  nationalId?: string;
  supportingDocuments?: string[]; // multiple file URLs
  registrationStatus?: "PENDING" | "APPROVED" | "REJECTED";
};


 