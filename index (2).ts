/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { router } from './_lib/handlers';

const app = express();

app.use(express.json());
app.use('/api', router);
app.use(router);

export default app;
