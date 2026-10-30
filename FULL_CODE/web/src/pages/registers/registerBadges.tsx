import { Badge } from '../../components/ui/Badge';
import type { ClinicalRegisterEntry } from '../../types';

export const getServiceBadge = (type: ClinicalRegisterEntry['service_type']) => {
  switch (type) {
    case 'ANC':
      return <Badge variant="pink">Maternal / ANC</Badge>;
    case 'PNC':
      return <Badge variant="purple">Postnatal / PNC</Badge>;
    case 'IMMUNIZATION':
      return <Badge variant="teal">Immunization (UIP)</Badge>;
    case 'NCD_SCREENING':
      return <Badge variant="amber">NCD Screening</Badge>;
    case 'GENERAL_OPD':
      return <Badge variant="blue">General OPD</Badge>;
    case 'REFERRAL':
      return <Badge variant="red">Emergency 108</Badge>;
    default:
      return <Badge variant="slate">{type}</Badge>;
  }
};

export const getStatusBadge = (status: ClinicalRegisterEntry['status']) => {
  switch (status) {
    case 'COMPLETED':
      return (
        <Badge variant="green" dot>
          Completed
        </Badge>
      );
    case 'FOLLOW_UP_REQUIRED':
      return (
        <Badge variant="amber" dot>
          Follow-up
        </Badge>
      );
    case 'REFERRED':
      return (
        <Badge variant="red" dot>
          Referred
        </Badge>
      );
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};
