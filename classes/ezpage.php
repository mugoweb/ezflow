<?php

class eZPage
{
    var $attributes = array();

    function eZPage( $name = null )
    {
        if ( isset( $name ) )
        $this->attributes['name'] = $name;
    }

    function toXML()
    {
        $dom = new DOMDocument( );
        $dom->formatOutput = true;
        $success = $dom->loadXML('<page />');

        $pageNode = $dom->documentElement;

        foreach ( $this->attributes as $attrName => $attrValue )
        {
            switch ( $attrName )
            {
                case 'id':
                    $pageNode->setAttribute( 'id', $attrValue );
                    break;

                case 'zones':
                    foreach ( $this->attributes['zones'] as $zone )
                    {
                        $zoneNode = $zone->toXML( $dom );
                        $pageNode->appendChild( $zoneNode );
                    }
                    break;

                default:
                    $node = $dom->createElement( $attrName );
                    $nodeValue = $dom->createTextNode( $attrValue );
                    $node->appendChild( $nodeValue );
                    $pageNode->appendChild( $node );
                    break;
            }
        }

        return $dom->saveXML();
    }

    static function createFromXML( $source )
    {
        $newObj = new eZPage();

        if ( $source )
        {
            //$dom = domxml_open_mem( $source );
            $dom = new DOMDOcument();
            $success = $dom->loadXML( $source );
            $root = $dom->documentElement;

            foreach ( $root->childNodes as $node )
            {
                if ( $node->nodeType == XML_ELEMENT_NODE && $node->nodeName == 'zone' )
                {
                    $zoneNode =& eZPageZone::createFromXML( $node );
                    $newObj->attributes['zones'][] =& $zoneNode;
                }
                elseif ( $node->nodeType == XML_ELEMENT_NODE )
                {               
                    $newObj->attributes[$node->nodeName] = $node->nodeValue;
                }
            }

            if ( $root->hasAttributes() )
            {
                foreach ( $root->attributes as $attr )
                {
                    $newObj->attributes[$attr->name] = $attr->value;
                }
            }
        }

        return $newObj;
    }

    function &addZone( $zone )
    {
        $this->attributes['zones'][] =& $zone;
        return $zone;
    }

    function &getZone( $id )
    {
        $zone =& $this->attributes['zones'][$id];
        return $zone;
    }

    function getName()
    {
        return isset( $this->attributes['name'] ) ? $this->attributes['name'] : null;
    }

    function removeZone( $id )
    {
        $zone =& $this->getZone( $id );

        if ( $zone->toBeAdded() )
        {
            unset( $this->attributes['zones'][$id] );
        }
        else
        {
            $zone->setAttribute( 'action', 'remove' );
        }
    }

    function removeZones()
    {
        foreach( $this->attributes['zones'] as $index => $zone )
        {
            if ( $zone->toBeAdded() )
            {
                unset( $this->attributes['zones'] );
            }
            else
            {
                $zone->setAttribute( 'action', 'remove' );
                $this->attributes['zones'][$index] = $zone;
            }
        }
    }

    function getZoneCount()
    {
        return isset( $this->attributes['zones'] ) ? count( $this->attributes['zones'] ) : 0;
    }

    function attributes()
    {

        return array_keys( $this->attributes );
    }

    function hasAttribute( $name )
    {
        return in_array( $name, array_keys( $this->attributes ) );
    }

    function setAttribute( $name, $value )
    {
        $this->attributes[$name] = $value;
    }

    function &attribute( $name )
    {
        return $this->attributes[$name];
    }

    function removeProcessed()
    {
        if ( $this->getZoneCount() > 0 )
        {
            foreach ( $this->attributes['zones'] as $index => $zone )
            {
                if ( $zone->toBeRemoved() )
                {
                    unset( $this->attributes['zones'][$index] );
                }
                else
                {
                    $this->attributes['zones'][$index] = $zone->removeProcessed();
                }
            }
        }
    }
}

?>