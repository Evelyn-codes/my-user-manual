import worker from '../../worker.mjs';
export const onRequest = ({request,env}) => worker.fetch(request,env);
