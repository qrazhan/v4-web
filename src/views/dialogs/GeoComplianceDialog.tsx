import { useState } from 'react';

import styled, { AnyStyledComponent } from 'styled-components';

import { ComplianceAction, Nullable, ParsingError } from '@/constants/abacus';
import { ButtonAction } from '@/constants/buttons';
import { COUNTRIES_MAP } from '@/constants/geo';
import { STRING_KEYS } from '@/constants/localization';

import { useBreakpoints, useStringGetter } from '@/hooks';

import { formMixins } from '@/styles/formMixins';

import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { Dialog, DialogPlacement } from '@/components/Dialog';
import { SearchSelectMenu } from '@/components/SearchSelectMenu';
import { WithReceipt } from '@/components/WithReceipt';

import abacusStateManager from '@/lib/abacus';
import { isBlockedGeo } from '@/lib/compliance';
import { log } from '@/lib/telemetry';

type ElementProps = {
  setIsOpen?: (open: boolean) => void;
};

const CountrySelector = ({
  label,
  selectedCountry,
  onSelect,
}: {
  label: string;
  selectedCountry: string;
  onSelect: (country: string) => void;
}) => {
  const stringGetter = useStringGetter();

  const countriesList = Object.keys(COUNTRIES_MAP).map((country) => ({
    value: country,
    label: country,
    onSelect: () => onSelect(country),
  }));

  return (
    <SearchSelectMenu
      items={[
        {
          group: 'countries',
          groupLabel: stringGetter({ key: STRING_KEYS.COUNTRY }),
          items: countriesList,
        },
      ]}
      label={label}
      withSearch
    >
      <Styled.SelectedCountry>
        {selectedCountry || stringGetter({ key: STRING_KEYS.SELECT_A_COUNTRY })}
      </Styled.SelectedCountry>
    </SearchSelectMenu>
  );
};

export const GeoComplianceDialog = ({ setIsOpen }: ElementProps) => {
  const stringGetter = useStringGetter();

  const [residence, setResidence] = useState('');
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const { isMobile } = useBreakpoints();

  const submit = async () => {
    const action =
      residence && isBlockedGeo(COUNTRIES_MAP[residence])
        ? ComplianceAction.INVALID_SURVEY
        : ComplianceAction.VALID_SURVEY;

    const callback = (success: boolean, parsingError?: Nullable<ParsingError>) => {
      if (success) {
        setIsOpen?.(false);
      } else {
        log('useWithdrawalInfo/getWithdrawalCapacityByDenom', new Error(parsingError?.message));
      }
    };
    abacusStateManager.triggerCompliance(action, callback);
  };

  return (
    <Dialog
      isOpen
      setIsOpen={setIsOpen}
      title={stringGetter({ key: STRING_KEYS.COMPLIANCE_REQUEST })}
      placement={isMobile ? DialogPlacement.FullScreen : DialogPlacement.Default}
    >
      {showForm ? (
        <Styled.Form>
          <CountrySelector
            label={stringGetter({ key: STRING_KEYS.COUNTRY_OF_RESIDENCE })}
            selectedCountry={residence}
            onSelect={setResidence}
          />
          <Styled.WithReceipt
            slotReceipt={
              <Styled.CheckboxContainer>
                <Checkbox
                  checked={hasAcknowledged}
                  onCheckedChange={setHasAcknowledged}
                  id="acknowledge-secret-phase-risk"
                  label={stringGetter({
                    key: STRING_KEYS.COMPLIANCE_ACKNOWLEDGEMENT,
                  })}
                />
              </Styled.CheckboxContainer>
            }
          >
            <Button
              action={ButtonAction.Primary}
              onClick={() => submit()}
              state={{ isDisabled: !hasAcknowledged }}
            >
              {stringGetter({ key: STRING_KEYS.SUBMIT })}
            </Button>
          </Styled.WithReceipt>
        </Styled.Form>
      ) : (
        <Styled.Form>
          <p>{stringGetter({ key: STRING_KEYS.COMPLIANCE_BODY_FIRST_OFFENSE_1 })}</p>
          <p>{stringGetter({ key: STRING_KEYS.COMPLIANCE_BODY_FIRST_OFFENSE_2 })}</p>
          <Button action={ButtonAction.Primary} onClick={() => setShowForm(true)}>
            {stringGetter({ key: STRING_KEYS.CONTINUE })}
          </Button>
        </Styled.Form>
      )}
    </Dialog>
  );
};

const Styled: Record<string, AnyStyledComponent> = {};

Styled.Form = styled.form`
  ${formMixins.transfersForm}
`;

Styled.SelectedCountry = styled.div`
  text-align: start;
`;

Styled.CheckboxContainer = styled.div`
  padding: 1rem;
  color: var(--color-text-0);
`;

Styled.WithReceipt = styled(WithReceipt)`
  --withReceipt-backgroundColor: var(--color-layer-2);
`;
