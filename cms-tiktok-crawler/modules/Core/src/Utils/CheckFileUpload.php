<?php
namespace Modules\Core\Utils;

use Illuminate\Support\Facades\Storage;

class CheckFileUpload
{
	private static $allowedImageExtensions = ['jpeg', 'png', 'jpg', 'gif'];
	private static $allowedFileExtensions = ['csv', 'xlsx'];
	private static $maxImageSize = 2048; // in KB

	public static function checkImageFile($file)
	{
		if (!isset($file) || $file->getError() !== UPLOAD_ERR_OK) {
			return false;
		}

		$extension = strtolower($file->getClientOriginalExtension());
		$size = $file->getSize() / 1024; // Convert to KB

		if (!in_array($extension, self::$allowedImageExtensions)) {
			return false;
		}

		if ($size > self::$maxImageSize) {
			return false;
		}

		return true;
	}
}