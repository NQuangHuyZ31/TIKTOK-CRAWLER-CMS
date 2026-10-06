<?php

namespace Modules\Crawler\Utils;

class FetchAPIUtil {
	public static function fetchAPI($url, $method = 'GET', $payload = null, $headers = []) {
		if ($url === null || $url === '' || in_array($method, ['POST', 'PUT', 'PATCH']) || $payload === null) {
			return false;
		}
		

	}
}