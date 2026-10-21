import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceUrl,defaultServices} from '../public/services.js';
test('provider defaults are valid HTTPS destinations and preserve Muse identity',()=>{for(const value of Object.values(defaultServices))assert.equal(serviceUrl(value),value);assert.equal(defaultServices.muse,'https://muse.ai/');});
test('service destinations reject executable schemes, credentials and malformed URLs',()=>{for(const value of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:pass@example.com','not a url',null])assert.equal(serviceUrl(value),null);});
test('personal project URLs retain their path and query without adding task text',()=>{const url='https://claude.ai/project/123?view=work#notes';assert.equal(serviceUrl(url),url);});
