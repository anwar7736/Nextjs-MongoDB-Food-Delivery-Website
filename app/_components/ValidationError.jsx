const ValidationError = (props) => {
    const message = props.message ?? 'This field is required.';
  return (
    <div>
        <p className="text-red-500 text-sm text-start">
            {message}
        </p>
    </div>
  )
}

export default ValidationError