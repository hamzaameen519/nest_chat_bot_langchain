export default function customMessage(
  status: number,
  message: string,
  data?: any,
) {
  return {
    status,
    message,
    data,
  };
}
