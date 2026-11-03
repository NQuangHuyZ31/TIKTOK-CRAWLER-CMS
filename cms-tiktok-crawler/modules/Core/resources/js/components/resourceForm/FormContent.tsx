import React, { ReactNode } from 'react';
import type { ResourceFormRenderContext } from '../ResourceForm';

export default function FormContent<T>({
	renderFn,
	context,
}: {
	renderFn: (context: ResourceFormRenderContext<T>) => ReactNode;
	context: ResourceFormRenderContext<T>;
}) {
	return <>{renderFn(context)}</>;
}
