type SolutionCardName = {
  acronym: string;
  title: string;
};

export function solutionCardLabel({ acronym, title }: SolutionCardName) {
  return `${acronym} ${title}`;
}

export function WebsiteSolutionCardName({ acronym, title }: SolutionCardName) {
  return (
    <>
      <span className="web-product-acronym">{acronym}</span> {title}
    </>
  );
}
