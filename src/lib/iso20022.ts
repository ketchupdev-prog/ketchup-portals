/**
 * ISO 20022 message types and helpers for bank integration (PRD §17.3).
 * pain.001 (Payment Initiation) TPP → Bank; pacs.002 (Payment Status) Bank → TPP.
 * No mocks: use when backend initiates or receives payments via bank/clearing.
 * Location: ketchup-portals/src/lib/iso20022.ts
 */

/** pain.001 – Payment Initiation (single payment from debtor to creditor) */
export type Pain001Payload = {
  MessageIdentification: string;
  CreationDateTime: string; // ISO 8601
  NumberOfTransactions: string; // "1"
  InitiatingParty?: { Name: string };
  PaymentInformation: {
    PaymentInformationIdentification: string;
    PaymentMethod: string; // "TRF"
    RequestedExecutionDate: string; // YYYY-MM-DD
    Debtor: {
      Name: string;
      Account?: { Identification: string; SchemeName?: string };
    };
    DebtorAccount?: { Identification: string; SchemeName?: string };
    DebtorAgent?: { FinancialInstitutionIdentification: { BICFI?: string } };
    CreditTransferTransactionInformation: {
      InstructionIdentification: string;
      EndToEndIdentification: string;
      Amount: { Amount: string; Currency: string };
      Creditor: { Name: string };
      CreditorAccount: { Identification: string; SchemeName?: string };
      CreditorAgent?: { FinancialInstitutionIdentification: { BICFI?: string } };
      RemittanceInformation?: { Unstructured?: string };
    }[];
  };
};

/** pacs.002 – Payment Status (status of an instruction) */
export type Pacs002Payload = {
  OrgnlGrpInfAndSts?: { OrgnlMsgId?: string; OrgnlMsgNmId?: string }[];
  OrgnlInstrId?: string;
  OrgnlEndToEndId?: string;
  TxSts?: "ACCP" | "RJCT" | "PDNG" | "ACTC"; // Accepted, Rejected, Pending, AcceptedTechnical
  StsRsnInf?: { Rsn?: { Cd?: string }; AddtlInf?: string }[];
};

/**
 * Build pain.001 JSON (scheme may accept JSON or XML; align with Namibian Open Banking).
 * Debtor = Buffr operational/trust account; Creditor = beneficiary account (§17.3).
 */
export function buildPain001(params: {
  messageId: string;
  instructionId: string;
  endToEndId: string;
  amount: string;
  currency: string;
  debtorName: string;
  debtorAccount?: string;
  creditorName: string;
  creditorAccount: string;
  requestedExecutionDate: string;
  remittanceInformation?: string;
}): Pain001Payload {
  return {
    MessageIdentification: params.messageId,
    CreationDateTime: new Date().toISOString(),
    NumberOfTransactions: "1",
    InitiatingParty: { Name: params.debtorName },
    PaymentInformation: {
      PaymentInformationIdentification: params.messageId,
      PaymentMethod: "TRF",
      RequestedExecutionDate: params.requestedExecutionDate,
      Debtor: { Name: params.debtorName, Account: params.debtorAccount ? { Identification: params.debtorAccount, SchemeName: "IBAN" } : undefined },
      DebtorAccount: params.debtorAccount ? { Identification: params.debtorAccount, SchemeName: "IBAN" } : undefined,
      CreditTransferTransactionInformation: [
        {
          InstructionIdentification: params.instructionId,
          EndToEndIdentification: params.endToEndId,
          Amount: { Amount: params.amount, Currency: params.currency },
          Creditor: { Name: params.creditorName },
          CreditorAccount: { Identification: params.creditorAccount, SchemeName: "IBAN" },
          RemittanceInformation: params.remittanceInformation ? { Unstructured: params.remittanceInformation } : undefined,
        },
      ],
    },
  };
}

/**
 * Parse pacs.002 (Payment Status) from bank. Extract TxSts and reason.
 */
export function parsePacs002(json: unknown): Pacs002Payload | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  const txSts = o.TxSts as string | undefined;
  if (txSts && ["ACCP", "RJCT", "PDNG", "ACTC"].includes(txSts)) {
    return {
      OrgnlInstrId: o.OrgnlInstrId as string | undefined,
      OrgnlEndToEndId: o.OrgnlEndToEndId as string | undefined,
      TxSts: txSts as Pacs002Payload["TxSts"],
      StsRsnInf: o.StsRsnInf as Pacs002Payload["StsRsnInf"],
    };
  }
  return (json as Pacs002Payload) ?? null;
}
