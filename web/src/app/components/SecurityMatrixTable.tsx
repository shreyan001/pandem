"use client";

import React from "react";
import { Check, X, AlertTriangle } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Section,
} from "../../ui";

interface MatrixRow {
  layer: string;
  traditional: string;
  unsealed: string;
  pandem: string;
}

const MATRIX_DATA: MatrixRow[] = [
  {
    layer: "LLM Inference",
    traditional: "Plaintext API logs & retention",
    unsealed: "Stateless API only",
    pandem: "NEAR AI Cloud H100 TEE",
  },
  {
    layer: "Agent Runtime",
    traditional: "Plaintext cloud RAM dumps",
    unsealed: "Exposed in founder memory",
    pandem: "Intel TDX Enclave CVM",
  },
  {
    layer: "User Database",
    traditional: "Datacenter operators can dump DB",
    unsealed: "Unencrypted disk storage",
    pandem: "KMS-Sealed Enclave PostgreSQL",
  },
  {
    layer: "Frontend Hosting",
    traditional: "Mutable centralized DNS",
    unsealed: "Single server IP address",
    pandem: "Filecoin + FastFS Pinning",
  },
  {
    layer: "Payment Trail",
    traditional: "Credit card identity tracked",
    unsealed: "Public block explorer history",
    pandem: "NEAR Confidential Intents",
  },
];

export const SecurityMatrixTable: React.FC = () => {
  return (
    <Section
      title="Architecture and Security Matrix"
      description="Technical verification across five architectural layers."
      bordered={false}
      className="p-0 sm:p-0 bg-transparent space-y-4"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/4">Stack Layer</TableHead>
            <TableHead className="w-1/4">Traditional SaaS</TableHead>
            <TableHead className="w-1/4">Unsealed Crypto VPS</TableHead>
            <TableHead className="w-1/4 bg-spectr-surface-raised text-spectr-primary">
              Pandem Enclave
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MATRIX_DATA.map((row) => (
            <TableRow key={row.layer}>
              <TableCell className="font-semibold text-spectr-ink">
                {row.layer}
              </TableCell>
              <TableCell className="text-spectr-danger">
                <span className="flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{row.traditional}</span>
                </span>
              </TableCell>
              <TableCell className="text-spectr-warning">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{row.unsealed}</span>
                </span>
              </TableCell>
              <TableCell className="font-medium text-spectr-ink bg-spectr-surface-raised/40">
                <span className="text-spectr-success flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{row.pandem}</span>
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  );
};
