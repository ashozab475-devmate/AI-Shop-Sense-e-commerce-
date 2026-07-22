import { NextResponse } from 'next/server';

export function handleError(error, statusCode = 500) {
  console.error('API Error:', error);
  
  const message = error?.message || 'Internal server error';
  
  return NextResponse.json(
    { error: message },
    { status: statusCode }
  );
}

export function handleSuccess(data, statusCode = 200) {
  return NextResponse.json(data, { status: statusCode });
}
