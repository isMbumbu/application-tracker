interface DetailItemProps {
  label: string
  value: string
}

function DetailItem({
  label,
  value,
}: Readonly<DetailItemProps>) {
  return (
    <div className="detail-item">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default DetailItem