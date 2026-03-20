import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";

interface Props {
  children: string | null | undefined;
}

export const ModalErrorMessage = ({ children }: Props) => {
  if (children == null || children === "") {
    return null;
  }
  return (
    <span className="text-cax-danger block" role="alert">
      <span className="mr-1">
        <FontAwesomeIcon iconType="exclamation-circle" styleType="solid" />
      </span>
      {children}
    </span>
  );
};
